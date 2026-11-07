import {NextResponse} from 'next/server';
import {currentUser,hasAccess,publicUser,validateOrigin} from '@/lib/admin-auth';
import {mutateCms,readCms,newRow,TABLES,CmsStorageError,type CmsStore} from '@/lib/cms-store';
import {isAllowedImageUrl} from '@/lib/image-urls';
import {latestById} from '@/lib/cms-dedupe';
export const runtime='nodejs';export const dynamic='force-dynamic';
const tableAccess:Record<string,string>={specialists:'specialists',specialties:'specialties',specialist_specialties:'specialists',blog_posts:'blog',blog_categories:'blog',achievements:'achievements',site_settings:'settings',availability_settings:'availability',dynamic_sections:'sections',departments:'departments',activity_logs:'settings',profiles:'users'};
const published=(t:string,r:Record<string,unknown>)=>t==='specialists'||t==='specialties'||t==='achievements'?r.is_published===true:t==='blog_posts'?r.status==='published':t==='availability_settings'?r.is_active===true:t==='dynamic_sections'?r.is_enabled===true:t==='site_settings'?r.is_public===true:t==='blog_categories'||t==='departments'?true:false;
type Filter={key:string;value:unknown};
type Query={table:string;action:'select'|'insert'|'update'|'delete'|'upsert';filters?:Filter[];order?:{key:string;ascending:boolean};limit?:number;selection?:string;payload?:Record<string,unknown>|Record<string,unknown>[];head?:boolean;count?:string;onConflict?:string};
function filterRows(rows:Record<string,unknown>[],filters:Filter[]){return rows.filter(r=>filters.every(f=>r[f.key]===f.value))}
function safeBody(data:unknown){return data&&typeof data==='object'&&!Array.isArray(data)?data as Record<string,unknown>:null}
function err(error:string,status=400){return NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){try{
 if(!await validateOrigin(req))return err('طلب غير موثوق',403);
 const q=await req.json() as Query;
 if(!TABLES.includes(q.table as typeof TABLES[number])&&q.table!=='profiles')return err('جدول غير معروف');
 if(!['select','insert','update','delete','upsert'].includes(q.action))return err('عملية غير صالحة');
 const user=await currentUser();const publicRead=q.action==='select';
 if(!publicRead&&!hasAccess(user,tableAccess[q.table]))return err('ليس لديك صلاحية تعديل هذا القسم',403);
 if(q.table==='profiles'&&!user)return err('غير مصرح',403);
 if(q.table==='profiles'&&q.action!=='select')return err('استخدم صفحة إدارة الحسابات',403);
 if(q.action!=='select'&&q.table==='activity_logs'&&user?.role!=='super_admin')return err('غير مصرح',403);
 const filters=(Array.isArray(q.filters)?q.filters:[]).slice(0,10).filter(x=>typeof x.key==='string'&&/^[a-z_]{2,40}$/.test(x.key));
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
 const payload=Array.isArray(q.payload)?q.payload:[q.payload];
 if(!payload.length||payload.length>30||payload.some(x=>!safeBody(x)))return err('البيانات غير صالحة');
 if(payload.some(row=>{const r=safeBody(row);return r&&(['image_url','cover_image_url'].some(k=>typeof r[k]==='string'&&!isAllowedImageUrl(String(r[k]))))}))return err('رابط الصورة غير صالح؛ استخدم رابط HTTPS أو مساراً داخل الموقع.',400);
 if(q.table==='site_settings'&&payload.some(row=>{const r=safeBody(row);const v=r?.value;return r?.key==='site_visuals'&&v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).some(x=>typeof x==='string'&&!isAllowedImageUrl(x))}))return err('رابط الصورة غير صالح. استخدم رابط HTTPS مباشراً.',400);
 if(q.action==='update'||q.action==='delete'){if(!filters.length)return err('يلزم تحديد السجل عند التعديل أو الحذف');}
 if(q.action==='upsert'&&(!q.onConflict||!/^[a-z_]{2,40}$/.test(q.onConflict)))return err('تحديد مفتاح السجل مطلوب');
 const result=await mutateCms(store=>{
  const rows=store.tables[q.table] ||= [];
  if(q.action==='delete'){const found=filterRows(rows,filters);store.tables[q.table]=rows.filter(x=>!found.includes(x));return found}
  if(q.action==='update'){const found=filterRows(rows,filters);for(const row of found){for(const [k,v] of Object.entries(safeBody(payload[0])||{}))if(k!=='id'&&k!=='created_at')row[k]=v;row.updated_at=new Date().toISOString()}return found}
  const added:Record<string,unknown>[]=[];
  for(const candidate of payload){const body=safeBody(candidate)!;
   const clean=Object.fromEntries(Object.entries(body).filter(([k])=>k!=='created_at'&&k!=='updated_at'));
   const index=q.action==='upsert'?rows.findIndex(x=>x[q.onConflict!]===body[q.onConflict!]): -1;
   if(index>=0){Object.assign(rows[index],clean,{updated_at:new Date().toISOString()});added.push(rows[index]);continue}
   const row=newRow(clean);rows.push(row);added.push(row);
  }return added;
 });
 return NextResponse.json({data:result,error:null},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('[CMS] request failed',e instanceof Error?e.name:'unknown');
  if(e instanceof CmsStorageError)return err(e.message,e.code==='conflict'?409:503);
  return err('تعذر إتمام الطلب على الخادم. لم يتم حفظ التغييرات. أعد المحاولة بعد تحديث الصفحة.',503)
 }}
