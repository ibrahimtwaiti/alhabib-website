import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {currentUser,hasAccess,validateOrigin} from '@/lib/admin-auth';
import {readCms,mutateCms,newRow,CmsStorageError} from '@/lib/cms-store';
import {advertisingSnapshot,validateAd,validateAdSettings} from '@/lib/advertising';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 try{
  if(!hasAccess(await currentUser(),'advertising'))return reply({error:'لا تملك صلاحية إدارة الإعلانات'},403);
  return reply(advertisingSnapshot((await readCms()).store));
 }catch{return reply({error:'تعذر تحميل الإعلانات. أعد المحاولة.'},503)}
}
export async function POST(req:Request){
 try{
  const user=await currentUser();
  if(!hasAccess(user,'advertising')||!await validateOrigin(req))return reply({error:'غير مصرح'},403);
  const raw=await req.text();
  if(raw.length>20000)return reply({error:'الطلب كبير جداً'},413);
  let b:Record<string,unknown>;
  try{b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b))throw Error()}catch{return reply({error:'طلب غير صالح'},400)}
  if(typeof b.revision!=='string'||!['save','delete','reorder','settings'].includes(String(b.action)))return reply({error:'طلب غير صالح'},400);
  let ad:ReturnType<typeof validateAd>|undefined,settings:ReturnType<typeof validateAdSettings>|undefined;
  try{
   if(b.action==='save')ad=validateAd(b.ad);
   if(b.action==='settings')settings=validateAdSettings(b.settings);
  }catch(e){return reply({error:(e as Error).message},400)}
  if((b.action==='delete'||b.action==='save'&&b.id!=null)&&(typeof b.id!=='string'||!/^[0-9a-f-]{36}$/i.test(b.id)))return reply({error:'معرف الإعلان غير صالح'},400);
  if(b.action==='reorder'&&(!Array.isArray(b.ids)||b.ids.length>100||b.ids.some(id=>typeof id!=='string')||new Set(b.ids).size!==b.ids.length))return reply({error:'ترتيب الإعلانات غير صالح'},400);
  const newId=randomUUID(),revision=randomUUID(),now=new Date().toISOString();
  const snapshot=await mutateCms(store=>{
   const current=advertisingSnapshot(store);
   if(current.revision!==b.revision)throw new CmsStorageError('conflict','تم تعديل الإعلانات من جلسة أخرى. حدّث القائمة ثم أعد المحاولة.');
   let ads=current.ads;
   if(b.action==='save'){
    const existing=ads.find(a=>a.id===b.id);
    if(b.id&&!existing)throw new CmsStorageError('conflict','الإعلان لم يعد موجوداً. حدّث القائمة.');
    if(!existing&&ads.length>=100)throw new CmsStorageError('conflict','الحد الأقصى 100 إعلان.');
    const saved={...ad!,id:existing?.id||newId,created_at:existing?.created_at||now,updated_at:now};
    ads=existing?ads.map(a=>a.id===existing.id?saved:a):[...ads,saved];
   }else if(b.action==='delete'){
    if(!ads.some(a=>a.id===b.id))throw new CmsStorageError('conflict','الإعلان لم يعد موجوداً.');
    ads=ads.filter(a=>a.id!==b.id);
   }else if(b.action==='reorder'){
    const ids=b.ids as string[];
    if(ids.length!==ads.length||ids.some(id=>!ads.some(a=>a.id===id)))throw new CmsStorageError('conflict','تغيرت قائمة الإعلانات. حدّث القائمة.');
    ads=ids.map((id,i)=>({...ads.find(a=>a.id===id)!,sort_order:i,updated_at:now}));
   }
   store.tables.advertisements=ads;
   store.tables.advertising_config=[{settings:settings||current.settings,revision,updated_at:now}];
   const logs=store.tables.activity_logs ||= [];
   logs.unshift(newRow({actor_id:user!.id,actor_username:user!.username,operation:b.action,table_name:'advertisements',affected_count:b.action==='reorder'?ads.length:1}));
   if(logs.length>500)logs.length=500;
   return advertisingSnapshot(store);
  });
  return reply(snapshot);
 }catch(e){
  if(e instanceof CmsStorageError)return reply({error:e.message},e.code==='conflict'?409:503);
  return reply({error:'تعذر حفظ الإعلانات. لم يتم تأكيد الحفظ؛ حدّث القائمة قبل إعادة المحاولة.'},503);
 }
}
