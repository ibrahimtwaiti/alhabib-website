import {NextResponse} from 'next/server';
import {currentUser,hasAccess,publicUser,validateOrigin} from '@/lib/admin-auth';
import {mutateCms,readCms,newRow,TABLES,CmsStorageError,type CmsStore} from '@/lib/cms-store';
import {isAllowedImageUrl} from '@/lib/image-urls';
import {latestById} from '@/lib/cms-dedupe';
import {ABOUT_CONTENT_KEY,ABOUT_FIELDS} from '@/lib/about-content';
export const runtime='nodejs';export const dynamic='force-dynamic';
const tableAccess:Record<string,string>={specialists:'specialists',specialties:'specialties',specialist_specialties:'specialists',blog_posts:'blog',blog_categories:'blog',achievements:'achievements',site_settings:'settings',availability_settings:'availability',dynamic_sections:'sections',departments:'departments',activity_logs:'settings',content_revisions:'settings',profiles:'users'};
const published=(t:string,r:Record<string,unknown>)=>t==='specialists'||t==='specialties'||t==='achievements'?r.is_published===true:t==='blog_posts'?r.status==='published':t==='availability_settings'?r.is_active===true:t==='dynamic_sections'?r.is_enabled===true:t==='site_settings'?r.is_public===true:t==='blog_categories'||t==='departments'?true:false;
type Filter={key:string;value:unknown};
type Query={table:string;action:'select'|'insert'|'update'|'delete'|'upsert';filters?:Filter[];order?:{key:string;ascending:boolean};limit?:number;selection?:string;payload?:Record<string,unknown>|Record<string,unknown>[];head?:boolean;count?:string;onConflict?:string};
function filterRows(rows:Record<string,unknown>[],filters:Filter[]){return rows.filter(r=>filters.every(f=>r[f.key]===f.value))}
function safeBody(data:unknown){return data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:null}
function err(error:string,status=400){return NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){try{
 if(!await validateOrigin(req))return err('طلب غير موثوق',403);
 const raw=await req.text();
 if(raw.length>524288)return err('الطلب كبير جداً',413);
 let q:Query;try{q=JSON.parse(raw) as Query}catch{return err('تنسيق الطلب غير صالح',400)}
 if(!q||typeof q!=='object')return err('طلب غير صالح');
 if(!TABLES.includes(q.table as typeof TABLES[number])&&q.table!=='profiles')return err('جدول غير معروف');
 if(!['select','insert','update','delete','upsert'].includes(q.action))return err('عملية غير صالحة');
 const user=await currentUser();const publicRead=q.action==='select';
 if(!publicRead&&!hasAccess(user,tableAccess[q.table]))return err('ليس لديك صلاحية تعديل هذا القسم',403);
 if(q.table==='profiles'&&!user)return err('غير مصرح',403);
 if(q.table==='profiles'&&q.action!=='select')return err('استخدم صفحة إدارة الحسابات',403);
 if((q.table==='activity_logs'||q.table==='content_revisions')&&user?.role!=='super_admin')return err('غير مصرح',403);
 if(q.table==='content_revisions'&&q.action!=='select')return err('سجل النسخ السابقة للقراءة فقط',403);
 if(q.filters!==undefined&&!Array.isArray(q.filters))return err('شروط البحث غير صالحة');
 const suppliedFilters=Array.isArray(q.filters)?q.filters:[];
 if(suppliedFilters.length>10||suppliedFilters.some(f=>!f||typeof f!=='object'||typeof f.key!=='string'||!/^[a-z_]{2,40}$/.test(f.key)||!Object.prototype.hasOwnProperty.call(f,'value')||f.value===null||typeof f.value==='object'))return err('شروط البحث غير صالحة');
 const filters=suppliedFilters as Filter[];
 if(q.action==='select'){
  const {store}=await readCms();let rows=q.table==='profiles'?store.users.map(publicUser) as unknown as Record<string,unknown>[]:[...(store.tables[q.table]||[])];
  if(q.table==='specialists'||q.table==='specialties')rows=latestById(rows);
  if(!user){rows=rows.filter(r=>published(q.table,r))}else if(q.table==='profiles'&&user.role!=='super_admin'){rows=rows.filter(r=>r.id===user.id)}
  rows=filterRows(rows,filters);
  if(q.order&&/^[a-z_]{2,40}$/.test(q.order.key))rows.sort((a,b)=>{const left=String(a[q.order!.key]??'');const right=String(b[q.order!.key]??'');return (left<right?-1:left>right?1:0)*(q.order!.ascending?1:-1)});
  const count=rows.length;rows=rows.slice(0,Math.max(0,Math.min(200,q.limit??200)));
  if(q.selection&&q.selection!=='*'){
   const fields=q.selection.split(',').filter(f=>/^[a-z_]+$/.test(f));rows=rows.map(r=>Object.fromEntries(fields.map(k=>[k,r[k]])));
  }
  return NextResponse.json({data:q.head?null:rows,error:null,count:q.head?count:null},{headers:{'Cache-Control':'no-store'}});
 }
 if(!user)return err('يرجى تسجيل الدخول',401);
 // DELETE only needs a validated record filter; requiring a body made all admin deletions fail.
 const needsPayload=q.action!=='delete';
 const payload=needsPayload?(Array.isArray(q.payload)?q.payload:[q.payload]):[];
 if(needsPayload&&(!payload.length||payload.length>30||payload.some(x=>!safeBody(x))||(q.action==='update'&&payload.length!==1)))return err('البيانات غير صالحة');
 if(payload.some(row=>{const r=safeBody(row);return r&&(['image_url','cover_image_url'].some(k=>typeof r[k]==='string'&&!isAllowedImageUrl(String(r[k]))))}))return err('رابط الصورة غير صالح؛ استخدم رابط HTTPS أو مساراً داخل الموقع.',400);
 if(q.table==='site_settings'&&payload.some(row=>{
  const r=safeBody(row);const v=r?.value;
  if(r?.key!=='site_visuals'||!v||typeof v!=='object'||Array.isArray(v))return false;
  const visuals=v as Record<string,unknown>;
  const images=['logo','hero','feature_team','feature_specialties','feature_booking','feature_care','about_personal','about_team','about_whatsapp'];
  if(images.some(key=>visuals[key]!==undefined&&(typeof visuals[key]!=='string'||!isAllowedImageUrl(visuals[key] as string))))return true;
  if(visuals.heroFit!==undefined&&visuals.heroFit!=='cover'&&visuals.heroFit!=='contain')return true;
  return ['heroPositionX','heroPositionY'].some(key=>visuals[key]!==undefined&&
   (typeof visuals[key]!=='number'||!Number.isFinite(visuals[key])||(visuals[key] as number)<0||(visuals[key] as number)>100));
 }))return err('إعدادات الصورة غير صالحة؛ تحقق من الروابط والتمركز ونمط العرض.',400);
 if(q.table==='site_settings'&&payload.some(row=>{
  const r=safeBody(row);
  if(r?.key!==ABOUT_CONTENT_KEY)return false;
  const value=safeBody(r.value);
  return !value||!ABOUT_FIELDS.every(key=>typeof value[key]==='string'&&(value[key] as string).trim().length>0&&(value[key] as string).length<=3000)
   ||Object.keys(value).some(key=>!ABOUT_FIELDS.includes(key as typeof ABOUT_FIELDS[number]));
 }))return err('محتوى «من نحن» غير صالح. يجب تعبئة النصوص بالعربية والإنجليزية.',400);
 if(q.action==='update'||q.action==='delete'){if(!filters.length)return err('يلزم تحديد السجل عند التعديل أو الحذف');}
 if(q.action==='upsert'&&(!q.onConflict||!/^[a-z_]{2,40}$/.test(q.onConflict)))return err('تحديد مفتاح السجل مطلوب');
 const result=await mutateCms(store=>{
  const rows=store.tables[q.table] ||= [];
  /** Keep only bounded, admin-only snapshots of editorial records, never patient data or credentials. */
  const archive=(row:Record<string,unknown>)=>{
   if(!['specialists','specialties','blog_posts','achievements','site_settings','availability_settings','dynamic_sections'].includes(q.table))return;
   if(q.table==='site_settings'&&row.key!=='site_visuals'&&row.key!==ABOUT_CONTENT_KEY)return;
   const serialized=JSON.stringify(row);
   if(serialized.length>60000)return;
   const revisions=store.tables.content_revisions ||= [];
   revisions.unshift(newRow({source_table:q.table,source_id:String(row.id||''),source_key:typeof row.key==='string'?row.key:'',
    actor_username:user.username,operation:q.action,snapshot:JSON.parse(serialized)}));
   if(revisions.length>200)revisions.length=200;
  };
  const audit=(affected:Record<string,unknown>[])=>{
   if(q.table!=='activity_logs'&&affected.length){
    const history=store.tables.activity_logs ||= [];
    history.unshift(newRow({actor_id:user.id,actor_username:user.username,operation:q.action,table_name:q.table,affected_count:affected.length}));
    if(history.length>500)history.length=500;
   }
   return affected;
  };
  if(q.action==='delete'){const found=filterRows(rows,filters);for(const row of found)archive(row);store.tables[q.table]=rows.filter(x=>!found.includes(x));return audit(found)}
  if(q.action==='update'){const found=filterRows(rows,filters);for(const row of found){archive(row);for(const [k,v] of Object.entries(safeBody(payload[0])||{}))if(k!=='id'&&k!=='created_at')row[k]=v;row.updated_at=new Date().toISOString()}return audit(found)}
  const added:Record<string,unknown>[]=[];
  for(const candidate of payload){const body=safeBody(candidate)!;
   const clean=Object.fromEntries(Object.entries(body).filter(([k])=>k!=='created_at'&&k!=='updated_at'));
   const index=q.action==='upsert'?rows.findIndex(x=>x[q.onConflict!]===body[q.onConflict!]): -1;
   if(index>=0){archive(rows[index]);Object.assign(rows[index],clean,{updated_at:new Date().toISOString()});added.push(rows[index]);continue}
   const row=newRow(clean);rows.push(row);added.push(row);
  }return audit(added);
 });
 return NextResponse.json({data:result,error:null},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('[CMS] request failed',e instanceof Error?e.name:'unknown');
  if(e instanceof CmsStorageError)return err(e.message,e.code==='conflict'?409:503);
  return err('تعذر إتمام الطلب على الخادم. لم يتم حفظ التغييرات. أعد المحاولة بعد تحديث الصفحة.',503)
 }}
