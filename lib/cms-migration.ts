import 'server-only';
import {neon} from '@neondatabase/serverless';
import type {CmsStore} from './cms-store';

/**
 * Safe migration of the existing production CMS snapshot to an isolated Neon
 * project. The original DATABASE_URL stays authoritative until a separate,
 * reviewed production cutover. No accounts or editorial records are created
 * from defaults. A monotonically increasing source version prevents stale
 * reads from overwriting newer target snapshots.
 */
let targetSql:ReturnType<typeof neon>|undefined;
let schemaReady:Promise<unknown>|undefined;
let syncedVersion=-1;
let inFlight:Promise<void>|undefined;

function destination(){
 const value=process.env.ALHABIB_NEXT_DATABASE_URL;
 if(process.env.VERCEL_ENV!=='production'||!value||process.env.ALHABIB_PRIMARY_DATABASE_URL)return null;
 if(!/^postgres(?:ql)?:\/\//i.test(value))throw Error('Invalid Neon migration URL');
 const to=new URL(value);
 const from=new URL(process.env.DATABASE_URL||process.env.POSTGRES_URL||'postgresql://invalid:invalid@invalid.invalid/neondb');
 if(to.hostname===from.hostname&&to.pathname===from.pathname)throw Error('Migration target equals current production database');
 if(!to.hostname.endsWith('.neon.tech')||to.pathname!=='/alhabib_cms')throw Error('Unexpected migration destination');
 return targetSql||(targetSql=neon(value));
}
async function synchronize(sql:ReturnType<typeof neon>,store:CmsStore,version:number){
 if(!schemaReady){
  schemaReady=sql`CREATE TABLE IF NOT EXISTS alhabib_cms_state (
   id smallint PRIMARY KEY CHECK (id = 1),
   version bigint NOT NULL DEFAULT 0,
   payload jsonb NOT NULL,
   updated_at timestamptz NOT NULL DEFAULT now()
  )`.catch(error=>{schemaReady=undefined;throw error});
 }
 await schemaReady;
 const json=JSON.stringify(store);
 // Only insert new data or raise the target version, never replace newer data.
 await sql`INSERT INTO alhabib_cms_state (id,version,payload)
    VALUES (1,${version},${json}::jsonb)
    ON CONFLICT (id) DO UPDATE SET payload=EXCLUDED.payload,
       version=EXCLUDED.version,updated_at=now()
    WHERE alhabib_cms_state.version < EXCLUDED.version`;
 syncedVersion=Math.max(syncedVersion,version);
 console.info('[CMS migration] isolated Neon mirrored version',version);
}
export async function mirrorCmsToNeon(store:CmsStore,version:number){
 const sql=destination();
 if(!sql)return;
 if(!Number.isSafeInteger(version)||version<0)throw Error('Invalid source version');
 if(!Array.isArray(store.users)||store.users.length<1||!store.tables||typeof store.tables!=='object')
  throw Error('CMS source has no admin accounts or invalid editorial data; migration aborted');
 if(version<=syncedVersion)return;
 if(inFlight)await inFlight;
 if(version<=syncedVersion)return;
 inFlight=synchronize(sql,store,version);
 try{await inFlight}finally{inFlight=undefined}
}

export async function checkNeonMirror(store:CmsStore,version:number):Promise<boolean>{
 const sql=destination();
 if(!sql||!Number.isSafeInteger(version)||version<0)return false;
 const rows=await sql`SELECT version,payload=${JSON.stringify(store)}::jsonb AS matches
  FROM alhabib_cms_state WHERE id=1` as unknown as Array<{version:string|number;matches:boolean}>;
 return rows.length===1&&Number(rows[0].version)===version&&rows[0].matches===true;
}
