import 'server-only';
import {get,put,head} from '@vercel/blob';
import {randomUUID} from 'node:crypto';

export type CmsUser={id:string;username:string;full_name:string;password_hash:string;role:'super_admin'|'admin';permissions:Record<string,boolean>;is_active:boolean;session_version:number;failed_attempts?:number;locked_until?:number;created_at:string};
export type CmsStore={users:CmsUser[];tables:Record<string,Record<string,unknown>[]>;updated_at:string};
export const DATA_PATH='cms/private-state-v1.json';
export const TABLES=['specialists','specialties','specialist_specialties','blog_posts','achievements','site_settings','availability_settings','dynamic_sections','blog_categories','departments','activity_logs'] as const;
const initial=():CmsStore=>({users:[],tables:Object.fromEntries(TABLES.map(t=>[t,[]])),updated_at:new Date().toISOString()});
export function ensureBlob(){if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('التخزين الخاص غير مُهيأ على الخادم.');}
export async function readCms():Promise<{store:CmsStore;etag?:string}>{
 ensureBlob();const response=await get(DATA_PATH,{access:'private'});
 if(!response||response.statusCode!==200)return {store:initial()};
 const s=await new Response(response.stream).text();
 const p=JSON.parse(s) as CmsStore;
 if(!Array.isArray(p.users)||!p.tables||typeof p.tables!=='object')throw new Error('تعذر قراءة بيانات الإدارة');
 return {store:p,etag:response.blob.etag||(await head(DATA_PATH)).etag};
}
export class CmsStorageError extends Error{
 constructor(public readonly code:'unavailable'|'read'|'write'|'conflict',message:string){super(message);this.name='CmsStorageError'}
}
function isWriteConflict(error:unknown):boolean{
 const detail=error instanceof Error?error.name+' '+error.message:String(error);
 return /BlobPreconditionFailed|BlobAlreadyExists|precondition|etag|already exists|conflict|412|409/i.test(detail);
}
const RETRY_WAIT=[200,450,900,1600,2600,4000,5000];
export async function mutateCms<T>(fn:(store:CmsStore)=>T|Promise<T>):Promise<T>{
 for(let attempt=0;attempt<=RETRY_WAIT.length;attempt++){
  let snapshot:{store:CmsStore;etag?:string};
  try{snapshot=await readCms()}
  catch(error){console.error('[CMS] read failure',error instanceof Error?error.name:'unknown');throw new CmsStorageError('read','تعذر قراءة بيانات الإدارة من التخزين. يرجى التحقق من اتصال Vercel Blob.')}
  const {store,etag}=snapshot;
  const result=await fn(store);
  store.updated_at=new Date().toISOString();
  try{
   // Never unconditionally overwrite an existing state object; preserve admin accounts and concurrent edits.
   await put(DATA_PATH,JSON.stringify(store),{access:'private',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});
   return result;
  }catch(error){
   if(!isWriteConflict(error)){
    console.error('[CMS] write failure',error instanceof Error?error.name:'unknown');
    throw new CmsStorageError('write','تعذر حفظ التغييرات في التخزين الخاص. حاول مجدداً أو راجع اتصال Vercel Blob.');
   }
   if(attempt===RETRY_WAIT.length)break;
   // Private Blob reads may briefly observe a cached ETag after a write. Retry with spacing.
   await new Promise(resolve=>setTimeout(resolve,RETRY_WAIT[attempt]));
  }
 }
 throw new CmsStorageError('conflict','لم يُحفظ التغيير بسبب تعديل متزامن أو تأخر تحديث التخزين. انتظر دقيقة ثم أعد الحفظ دون إعادة رفع الصورة.');
}

export function newRow(value:Record<string,unknown>){return {id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...value}}
