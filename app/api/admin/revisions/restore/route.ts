import {NextResponse} from 'next/server';
import {currentUser,validateOrigin} from '@/lib/admin-auth';
import {mutateCms,newRow} from '@/lib/cms-store';
import {ABOUT_CONTENT_KEY} from '@/lib/about-content';
import {SOCIAL_LINKS_KEY} from '@/lib/social-links';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const editorialTables=new Set(['specialists','specialties','blog_posts','achievements','site_settings','availability_settings','dynamic_sections']);
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers});
/** Restore a server-stored editorial snapshot atomically. Never accept snapshot data from the browser. */
export async function POST(req:Request){
 const user=await currentUser();
 if(user?.role!=='super_admin')return fail('الاستعادة متاحة للمدير الرئيسي فقط',403);
 if(!await validateOrigin(req))return fail('طلب غير موثوق',403);
 if(Number(req.headers.get('content-length')||0)>4096)return fail('طلب غير صالح',413);
 let id='';
 try{const body=await req.json();if(typeof body?.revisionId==='string')id=body.revisionId}catch{}
 if(!/^[a-f0-9-]{36}$/i.test(id))return fail('معرف النسخة غير صالح',400);
 try{
  const result=await mutateCms(store=>{
   const revision=(store.tables.content_revisions||[]).find(r=>r.id===id);
   if(!revision)throw Error('REVISION_NOT_FOUND');
   const table=revision.source_table;
   if(typeof table!=='string'||!editorialTables.has(table))throw Error('REVISION_NOT_ALLOWED');
   const snapshot=revision.snapshot;
   if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw Error('REVISION_CORRUPT');
   const saved=snapshot as Record<string,unknown>;
   if(typeof saved.id!=='string'||!saved.id)throw Error('REVISION_CORRUPT');
   if(table==='site_settings'&&saved.key!=='site_visuals'&&saved.key!==ABOUT_CONTENT_KEY&&saved.key!==SOCIAL_LINKS_KEY)throw Error('REVISION_NOT_ALLOWED');
   const rows=store.tables[table] ||= [];
   const key=table==='site_settings'?'key':'id';
   const current=rows.find(r=>r[key]===saved[key]);
   if(current){
    const history=store.tables.content_revisions ||= [];
    history.unshift(newRow({source_table:table,source_id:String(current.id||''),source_key:String(current.key||''),
     actor_username:user.username,operation:'pre-restore',snapshot:JSON.parse(JSON.stringify(current))}));
    if(history.length>200)history.length=200;
   }
   store.tables[table]=rows.filter(r=>r[key]!==saved[key]);
   store.tables[table].push({...saved,updated_at:new Date().toISOString()});
   const audit=store.tables.activity_logs ||= [];
   audit.unshift(newRow({actor_id:user.id,actor_username:user.username,operation:'restore',table_name:table,affected_count:1,revision_id:id}));
   if(audit.length>500)audit.length=500;
   return {table,restored_id:saved.id};
  });
  return NextResponse.json({ok:true,...result},{headers});
 }catch(error){
  const message=error instanceof Error?error.message:'';
  if(message==='REVISION_NOT_FOUND')return fail('النسخة السابقة غير موجودة',404);
  if(message==='REVISION_NOT_ALLOWED'||message==='REVISION_CORRUPT')return fail('النسخة السابقة غير قابلة للاستعادة',400);
  return fail('تعذر استعادة النسخة. تحقق من اتصال Neon وعزل بيئة V3.',503);
 }
}
