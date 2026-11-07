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
 return {store:p,etag:response.blob.etag};
}
export async function mutateCms<T>(fn:(store:CmsStore)=>T|Promise<T>):Promise<T>{
 for(let attempt=0;attempt<5;attempt++){
  const {store,etag}=await readCms();const result=await fn(store);
  store.updated_at=new Date().toISOString();
  try{
   await put(DATA_PATH,JSON.stringify(store),{access:'private',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{}) ,contentType:'application/json'});
   return result;
  }catch(err){if(/precondition|already exists|conflict|412|409/i.test(String(err))&&attempt<4)continue;throw err;}
 }
 throw new Error('تعذر حفظ التغييرات بسبب تعديل متزامن. أعد المحاولة.');
}
export function newRow(value:Record<string,unknown>){return {id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...value}}
