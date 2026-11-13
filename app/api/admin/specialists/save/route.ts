import {NextResponse} from 'next/server';
import {currentUser,hasAccess,validateOrigin} from '@/lib/admin-auth';
import {mutateCms,newRow,CmsStorageError} from '@/lib/cms-store';
import {isAllowedImageUrl} from '@/lib/image-urls';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const responseHeaders={'Cache-Control':'no-store'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:responseHeaders});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fields=['name_ar','name_en','title_ar','title_en','bio_ar','bio_en','department','qualifications','conditions_ar','image_url','photo_fit','photo_position_x','photo_position_y','is_published'] as const;
class InputError extends Error{}
type Data=Record<string,unknown>;
const cleanText=(value:unknown,max:number,label:string)=>{
 if(typeof value!=='string'||value.length>max)throw new InputError('حقل غير صالح: '+label);
 return value.trim();
};
function sanitize(payload:unknown):Data{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new InputError('بيانات الأخصائي غير صالحة');
 const p=payload as Data;
 if(Object.keys(p).some(k=>!fields.includes(k as typeof fields[number])))throw new InputError('حقول غير مسموحة');
 const name_ar=cleanText(p.name_ar,160,'الاسم العربي');
 const name_en=cleanText(p.name_en,160,'الاسم الإنجليزي');
 if(!name_ar||!name_en)throw new InputError('الاسم بالعربية والإنجليزية مطلوب');
 if(p.department!=='women'&&p.department!=='men')throw new InputError('القسم غير صالح');
 if(p.photo_fit!=='contain'&&p.photo_fit!=='cover')throw new InputError('طريقة عرض الصورة غير صالحة');
 if(typeof p.is_published!=='boolean')throw new InputError('حالة النشر غير صالحة');
 if(p.image_url!==null&&typeof p.image_url!=='string')throw new InputError('رابط الصورة غير صالح');
 if(p.image_url!==null&&!isAllowedImageUrl(p.image_url as string))throw new InputError('رابط الصورة غير آمن');
 const array=(key:'qualifications'|'conditions_ar')=>{
  const values=p[key];
  if(!Array.isArray(values)||values.length>80||values.some(v=>typeof v!=='string'||v.length>600))throw new InputError('قائمة غير صالحة: '+key);
  return values.map((v:string)=>v.trim()).filter(Boolean);
 };
 const coordinate=(key:'photo_position_x'|'photo_position_y')=>{
  const number=p[key];
  if(typeof number!=='number'||!Number.isFinite(number)||number<0||number>100)return 50;
  return Math.round(number);
 };
 return {
  name_ar,name_en,title_ar:cleanText(p.title_ar,300,'المسمى العربي'),
  title_en:cleanText(p.title_en,300,'المسمى الإنجليزي'),
  bio_ar:cleanText(p.bio_ar,12000,'النبذة العربية'),
  bio_en:cleanText(p.bio_en,12000,'النبذة الإنجليزية'),
  department:p.department,qualifications:array('qualifications'),conditions_ar:array('conditions_ar'),
  image_url:p.image_url||null,photo_fit:p.photo_fit,
  photo_position_x:coordinate('photo_position_x'),photo_position_y:coordinate('photo_position_y'),
  is_published:p.is_published
 };
}
/** Save the specialist and its N specialties as ONE optimistic Neon CMS mutation.
 * If validation, permissions, or storage fails, neither the profile nor its links are committed.
 */
export async function POST(req:Request){
 const user=await currentUser();
 if(!hasAccess(user,'specialists'))return fail('لا تملك صلاحية تعديل الأخصائيين',403);
 if(!req.headers.get('origin')||(req.headers.get('sec-fetch-site')&&req.headers.get('sec-fetch-site')!=='same-origin')||!await validateOrigin(req))
  return fail('طلب غير موثوق',403);
 if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')return fail('صيغة الطلب غير صالحة',415);
 if(Number(req.headers.get('content-length')||0)>65536)return fail('حجم الطلب غير مسموح',413);
 let specialistId:string;let specialtyIds:string[];let payload:Data;
 try{
  const raw=await req.text();if(raw.length>65536)return fail('حجم الطلب غير مسموح',413);
  const q=JSON.parse(raw) as Record<string,unknown>;
  if(!q||typeof q!=='object'||Array.isArray(q))throw new InputError('طلب غير صالح');
  if(typeof q.specialistId!=='string'||!uuid.test(q.specialistId))throw new InputError('معرّف الأخصائي غير صالح');
  if(!Array.isArray(q.specialtyIds)||!q.specialtyIds.length||q.specialtyIds.length>50||q.specialtyIds.some(id=>typeof id!=='string'||!uuid.test(id)))throw new InputError('اختر تخصصاً واحداً على الأقل من القائمة');
  specialistId=q.specialistId;
  specialtyIds=[...new Set(q.specialtyIds as string[])];
  payload=sanitize(q.payload);
 }catch(e){return fail(e instanceof InputError?e.message:'طلب غير صالح',400)}
 try{
  const result=await mutateCms(store=>{
   const services=store.tables.specialties||[];
   const knownIds=new Set(services.map(row=>row.id).filter((id):id is string=>typeof id==='string'));
   if(specialtyIds.some(id=>!knownIds.has(id)))throw new InputError('أحد التخصصات لم يعد متاحاً. حدّث القائمة وأعد المحاولة.');
   const profiles=store.tables.specialists ||= [];
   const existing=profiles.find(row=>row.id===specialistId);
   const timestamp=new Date().toISOString();
   if(existing){
    const revisions=store.tables.content_revisions ||= [];
    const snapshot=JSON.stringify(existing);
    if(snapshot.length<=60000){
     revisions.unshift(newRow({source_table:'specialists',source_id:specialistId,source_key:'',
      actor_username:user!.username,operation:'update',snapshot:JSON.parse(snapshot)}));
     if(revisions.length>200)revisions.length=200;
    }
    Object.assign(existing,payload,{updated_at:timestamp});
   }else profiles.push(newRow({...payload,id:specialistId,languages:[],conditions_en:[]}));
   const oldLinks=store.tables.specialist_specialties||[];
   const oldIds=new Set(oldLinks.filter(row=>row.specialist_id===specialistId).map(row=>row.specialty_id));
   const selected=new Set(specialtyIds);
   // Preserve unmodified link IDs. Add/remove only the actual changed relations.
   const nextLinks=oldLinks.filter(row=>row.specialist_id!==specialistId||selected.has(row.specialty_id as string));
   for(const id of specialtyIds)if(!oldIds.has(id))
    nextLinks.push(newRow({specialist_id:specialistId,specialty_id:id}));
   store.tables.specialist_specialties=nextLinks;
   const history=store.tables.activity_logs ||= [];
   history.unshift(newRow({actor_id:user!.id,actor_username:user!.username,operation:'specialist-specialties-save',
    table_name:'specialists',affected_count:1,specialist_id:specialistId,specialties_count:specialtyIds.length}));
   if(history.length>500)history.length=500;
   return {specialistId,specialtyIds,created:!existing};
  });
  return NextResponse.json({ok:true,...result},{headers:responseHeaders});
 }catch(e){
  if(e instanceof InputError)return fail(e.message,409);
  if(e instanceof CmsStorageError)return fail(e.message,e.code==='conflict'?409:503);
  console.error('[specialist specializations] atomic save failed',e instanceof Error?e.name:'unknown');
  return fail('تعذر حفظ الأخصائي وتخصصاته؛ لم تُعتمد تعديلات جديدة. حدّث الصفحة وأعد المحاولة.',503);
 }
}
