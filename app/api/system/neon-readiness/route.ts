import {NextResponse} from 'next/server';
import {readCms} from '@/lib/cms-store';
import {checkNeonMirror} from '@/lib/cms-migration';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex'};
/** Exposes only whether a full internal version/payload check succeeded.
 * No credentials, CMS rows, account counts or snapshots are returned. */
export async function GET(){
 if(process.env.VERCEL_ENV!=='production'||!process.env.ALHABIB_NEXT_DATABASE_URL||process.env.ALHABIB_PRIMARY_DATABASE_URL)
  return NextResponse.json({ready:false,phase:'inactive'},{status:404,headers});
 try{
  const {store,etag}=await readCms(); // Internal read also attempts idempotent shadow sync.
  const version=Number((etag||'').replace(/^postgres:/,''));
  const ready=etag?.startsWith('postgres:')===true&&Number.isSafeInteger(version)&&
   await checkNeonMirror(store,version);
  return NextResponse.json({ready,phase:ready?'synced':'pending'},{status:ready?200:503,headers});
 }catch(error){
  console.error('[CMS migration] readiness failed',error instanceof Error?error.name:'unknown');
  return NextResponse.json({ready:false,phase:'error'},{status:503,headers});
 }
}
