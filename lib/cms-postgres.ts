import 'server-only';
import {neon} from '@neondatabase/serverless';
import {cmsDatabaseUrl,canWriteCms,isV3Preview,type CmsStore} from './cms-store';

/** Transactional CMS backend. Admins and content are in Postgres; pictures stay in Vercel Blob.
 * The existing private Blob JSON snapshot is imported exactly once on first connection.
 */
type DbSnapshot={store:CmsStore;version:number};
type Sql=ReturnType<typeof neon>;
let sqlClient:Sql|undefined;
let ready:Promise<void>|undefined;
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
function db():Sql{
 const url=cmsDatabaseUrl();
 if(!url||!/^postgres(?:ql)?:\/\//i.test(url))throw Error('DATABASE_URL غير مُهيأ. اربط Neon PostgreSQL بمشروع Vercel.');
 return sqlClient||(sqlClient=neon(url));
}
function assertStore(value:unknown):asserts value is CmsStore{
 if(!value||typeof value!=='object'||!Array.isArray((value as CmsStore).users)||
 !((value as CmsStore).tables)||typeof (value as CmsStore).tables!=='object')throw Error('Invalid CMS snapshot, migration aborted');
}
async function withNetworkRetry<T>(work:()=>Promise<T>):Promise<T>{
 for(let attempt=0;attempt<4;attempt++){
  try{return await work()}
  catch(error){
   const message=error instanceof Error?error.message:String(error);
   if(attempt===3||!/timeout|ETIMEDOUT|ECONNRESET|fetch failed|socket|502|503|504|connection terminated/i.test(message))throw error;
   await delay(120*(2**attempt));
  }
 }
 throw new Error('Database unavailable');
}
async function ensureSchema(sql:Sql){
 if(!ready){
  ready=withNetworkRetry(async()=>{
   await sql`CREATE TABLE IF NOT EXISTS alhabib_cms_state (
     id smallint PRIMARY KEY CHECK (id = 1),
     version bigint NOT NULL DEFAULT 0,
     payload jsonb NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`;
  }).catch(error=>{ready=undefined;throw error});
 }
 await ready;
}
export async function readPostgresCms(legacyReader:()=>Promise<CmsStore>):Promise<DbSnapshot>{
 const sql=db();const readOnlyPreview=isV3Preview()&&!canWriteCms();
 if(!readOnlyPreview)await ensureSchema(sql);
 let rows=(await withNetworkRetry(()=>sql`SELECT version,payload FROM alhabib_cms_state WHERE id = 1`)) as unknown as Array<{version:string|number;payload:unknown}>;
 if(rows.length===0){
  // Never reset a migrated production CMS or silently replace missing data with an old Blob copy.
  if(process.env.VERCEL_ENV==='production'&&process.env.ALHABIB_PRIMARY_DATABASE_URL)throw Error('Dedicated production CMS has not been migrated; refusing empty initialization');
  if(readOnlyPreview)throw Error('V3 shared preview is read-only and cannot initialize CMS data');
  // Do not silently create an empty admin account store if the legacy read fails.
  const legacy=await legacyReader();assertStore(legacy);
  await withNetworkRetry(()=>sql`INSERT INTO alhabib_cms_state (id,version,payload)
      VALUES (1,0,${JSON.stringify(legacy)}::jsonb) ON CONFLICT (id) DO NOTHING`);
  rows=(await withNetworkRetry(()=>sql`SELECT version,payload FROM alhabib_cms_state WHERE id = 1`)) as unknown as Array<{version:string|number;payload:unknown}>;
 }
 if(rows.length!==1)throw Error('Postgres CMS initialization failed');
 const payload=rows[0].payload;
 const store=typeof payload==='string'?JSON.parse(payload) as CmsStore:payload as CmsStore;
 assertStore(store);
 return {store,version:Number(rows[0].version)};
}
export async function mutatePostgresCms<T>(fn:(store:CmsStore)=>T|Promise<T>,legacyReader:()=>Promise<CmsStore>):Promise<T>{
 const sql=db();
 for(let attempt=0;attempt<12;attempt++){
  const {store,version}=await readPostgresCms(legacyReader);
  const result=await fn(store);
  store.updated_at=new Date().toISOString();
  const rows=(await withNetworkRetry(()=>sql`UPDATE alhabib_cms_state
      SET payload=${JSON.stringify(store)}::jsonb,version=version+1,updated_at=now()
      WHERE id=1 AND version=${version} RETURNING version`)) as unknown as Array<{version:string|number}>;
  if(rows.length===1)return result;
  await delay(Math.min(350,20*(attempt+1)));
 }
 throw Error('تعذر حفظ التغيير بسبب تعديلات متزامنة متكررة. أعد المحاولة.');
}
