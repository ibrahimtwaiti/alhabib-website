import 'server-only';
import {get,put,head} from '@vercel/blob';
import {randomUUID} from 'node:crypto';

export type CmsUser={id:string;username:string;full_name:string;password_hash:string;role:'super_admin'|'admin';permissions:Record<string,boolean>;is_active:boolean;session_version:number;failed_attempts?:number;locked_until?:number;created_at:string};
export type CmsStore={users:CmsUser[];tables:Record<string,Record<string,unknown>[]>;updated_at:string};
export const DATA_PATH='cms/private-state-v1.json';
export const TABLES=['specialists','specialties','specialist_specialties','blog_posts','achievements','site_settings','availability_settings','dynamic_sections','blog_categories','departments','activity_logs','content_revisions'] as const;
const initial=():CmsStore=>({users:[],tables:Object.fromEntries(TABLES.map(t=>[t,[]])),updated_at:new Date().toISOString()});
export function ensureBlob(){if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('التخزين الخاص غير مُهيأ على الخادم.');}
/** V3 preview is deliberately read-only until a distinct Neon branch URL is configured.
 * The primary DATABASE_URL often points to production even for Preview deployments. */
export function isV3Preview(){return process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_GIT_COMMIT_REF==='version-3'}
export function cmsDatabaseUrl(){
 const primary=process.env.DATABASE_URL||process.env.POSTGRES_URL||'';
 return isV3Preview()&&process.env.V3_PREVIEW_DATABASE_URL||primary;
}
export function canWriteCms(){
 if(!isV3Preview())return true;
 const isolated=process.env.V3_PREVIEW_DATABASE_URL;
 const primary=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!isolated||!/^postgres(?:ql)?:\/\//i.test(isolated))return false;
 try{
  const branch=new URL(isolated);
  if(!primary)return true;
  const live=new URL(primary);
  return branch.hostname!==live.hostname||branch.pathname!==live.pathname;
 }catch{return false}
}
export function cmsUsesPostgres(){return Boolean(cmsDatabaseUrl())}
export class CmsStorageError extends Error{
 constructor(public readonly code:'unavailable'|'read'|'write'|'conflict',message:string){super(message);this.name='CmsStorageError'}
}
const delay=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function readLegacyCms():Promise<{store:CmsStore;etag?:string}>{
 ensureBlob();
 for(let attempt=0;attempt<5;attempt++){
  try{
   const response=await get(DATA_PATH,{access:'private',useCache:false});
   if(!response)return {store:initial()};
   if(response.statusCode!==200||!response.stream)throw Error('Unexpected Blob response status '+response.statusCode);
   const content=await new Response(response.stream).text();
   const p=JSON.parse(content) as CmsStore;
   if(!Array.isArray(p.users)||!p.tables||typeof p.tables!=='object')throw Error('Legacy CMS data has an invalid structure');
   const etag=response.blob.etag||(await head(DATA_PATH)).etag;
   return {store:p,etag};
  }catch(error){
   if(attempt===4){console.error('[CMS] private Blob read exhausted',error instanceof Error?error.name:'unknown');throw new CmsStorageError('read','تعذر قراءة النسخة القديمة في Blob. لا يُنصح باستخدام Blob لتخزين بيانات الإدارة؛ اربط Neon Postgres.');}
   await delay(180*(2**attempt));
  }
 }
 throw new CmsStorageError('read','تعذر قراءة بيانات الإدارة.');
}
/** Read the authoritative database if configured. The legacy Blob is only an import source. */
export async function readCms():Promise<{store:CmsStore;etag?:string}>{
 if(cmsUsesPostgres()){
  const {readPostgresCms}=await import('./cms-postgres');
  try{
   const {store,version}=await readPostgresCms(async()=>(await readLegacyCms()).store);
   return {store,etag:`postgres:${version}`};
  }catch(error){
   if(error instanceof CmsStorageError)throw error;
   console.error('[CMS] PostgreSQL read failed',error instanceof Error?error.name:'unknown');
   throw new CmsStorageError('read','تعذر الاتصال بقاعدة بيانات المركز. حاول مرة أخرى أو راجع اتصال Neon.');
  }
 }
 return readLegacyCms();
}
function conflict(error:unknown){const v=error instanceof Error?error.name+' '+error.message:String(error);return /BlobPreconditionFailed|BlobAlreadyExists|precondition|etag|already exists|conflict|412|409/i.test(v)}
/** Updates are serialized with a PostgreSQL optimistic transaction. Legacy Blob fallback is temporary. */
export async function mutateCms<T>(fn:(store:CmsStore)=>T|Promise<T>):Promise<T>{
 if(!canWriteCms())throw new CmsStorageError('write','معاينة V3 للقراءة فقط: يجب ربط V3_PREVIEW_DATABASE_URL بفرع Neon مستقل قبل تعديل أي محتوى.');
 if(cmsUsesPostgres()){
  const {mutatePostgresCms}=await import('./cms-postgres');
  try{return await mutatePostgresCms(fn,async()=>(await readLegacyCms()).store)}
  catch(error){
   if(error instanceof CmsStorageError)throw error;
   console.error('[CMS] PostgreSQL write failed',error instanceof Error?error.name:'unknown');
   throw new CmsStorageError('write','تعذر حفظ التغيير في قاعدة بيانات المركز. حاول مجدداً أو راجع اتصال Neon.');
  }
 }
 // Compatibility only. This single-JSON-file store is not a production CMS database.
 for(let attempt=0;attempt<8;attempt++){
  const {store,etag}=await readLegacyCms();
  const result=await fn(store);
  store.updated_at=new Date().toISOString();
  try{
   await put(DATA_PATH,JSON.stringify(store),{access:'private',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});
   return result;
  }catch(error){
   if(!conflict(error)){
    console.error('[CMS] legacy Blob write error',error instanceof Error?error.name:'unknown');
    throw new CmsStorageError('write','تعذر حفظ بيانات الإدارة في Blob. يلزم ربط قاعدة Neon لتحقيق حفظ موثوق.');
   }
   if(attempt===7)break;
   await delay(Math.min(3600,200*(2**attempt)));
  }
 }
 throw new CmsStorageError('conflict','استمر تعارض التخزين القديم. يجب نقل بيانات الإدارة من Blob إلى قاعدة Neon.');
}
export function newRow(value:Record<string,unknown>){return {id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...value}}
