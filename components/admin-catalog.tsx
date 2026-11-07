'use client';
import {useCallback,useEffect,useState} from 'react';
import {ImagePlus,RefreshCw,Save,ShieldCheck,UploadCloud,Eye,EyeOff} from 'lucide-react';
import {createClient} from '@/lib/cms-client';
import {profiles,specialties,type Profile,type Specialty} from '@/lib/clinic-data';
import {builtinProfileId,profileById,CATALOG_SETTING_KEY,type CatalogMode} from '@/lib/catalog';
import {isAllowedImageUrl} from '@/lib/image-urls';

type Mode='team'|'specialties';
type AnyRecord=Record<string,unknown> & {id?:string;name_ar?:string;slug?:string;is_published?:boolean;image_url?:string|null};
type AdminProfile={role?:string;permissions?:Record<string,boolean>};
const can=(p:AdminProfile,key:string)=>p.role==='super_admin'||p.permissions?.[key]===true;
const toLines=(v:unknown)=>Array.isArray(v)?v.join('\n'):'';
const fromLines=(s:string)=>s.split('\n').map(x=>x.trim()).filter(Boolean);

export async function uploadPublicImage(file:File,folder:string){
 if(file.size>5*1024*1024)throw new Error('الحد الأقصى لحجم الصورة 5 ميجابايت');
 if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('يسمح فقط بصور JPG وPNG وWebP وAVIF');
 const extension=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'} as Record<string,string>)[file.type];
 const db=createClient();
 const path=`${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
 const {error}=await db.storage.from('site-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
 if(error)throw new Error('تعذر رفع الصورة إلى التخزين الخاص. '+error.message);
 return db.storage.from('site-media').getPublicUrl(path).data.publicUrl;
}

export default function AdminCatalog({module,profile}:{module:Mode;profile:AdminProfile}){
 const team=module==='team';const key=team?'specialists':'specialties';
 const allowed=can(profile,key);const owner=profile.role==='super_admin';
 const [rows,setRows]=useState<AnyRecord[]>([]);const [mode,setMode]=useState<CatalogMode>({});
 const [specialtyRows,setSpecialtyRows]=useState<{id:string;slug:string}[]>([]);const [relations,setRelations]=useState<{specialist_id:string;specialty_id:string}[]>([]);
 const [editing,setEditing]=useState<string|null>(null);const [form,setForm]=useState<Record<string,string>>({});
 const [file,setFile]=useState<File|null>(null);const [preview,setPreview]=useState('');
 const [published,setPublished]=useState(true);const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const [fresh,setFresh]=useState(0);
 const reload=useCallback(async()=>{
  const db=createClient();const [r,s]=await Promise.all([
   db.from(key).select('*').order('sort_order',{ascending:true}),
   db.from('site_settings').select('value').eq('key',CATALOG_SETTING_KEY).maybeSingle()
  ]);
  if(r.error)throw r.error;
  if(s.error)throw s.error;
  setRows((r.data||[]) as AnyRecord[]);setMode((s.data?.value||{}) as CatalogMode);
  if(team){const [ss,rr]=await Promise.all([db.from('specialties').select('id,slug'),db.from('specialist_specialties').select('specialist_id,specialty_id')]);if(ss.data)setSpecialtyRows(ss.data.filter((x:{id:string;slug:string|null})=>x.slug) as {id:string;slug:string}[]);if(rr.data)setRelations(rr.data)}
 },[key]);
 useEffect(()=>{if(!allowed)return;let active=true;(async()=>{try{await reload()}catch(e){if(active)setError((e as Error).message)}})();return()=>{active=false}},[allowed,reload,fresh]);
 useEffect(()=>{if(!file){setPreview('');return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);
 const defaults=team?profiles:specialties;
 const display=[...defaults.map(item=>{
  const r=rows.find(x=>team?(x.id===builtinProfileId(item.slug)||x.name_ar===(item as Profile).nameAr):x.slug===item.slug);
  return {identifier:item.slug,source:item,record:r,local:false};
 }),...rows.filter(r=>!defaults.some(x=>team?(r.id===builtinProfileId(x.slug)||r.name_ar===(x as Profile).nameAr):r.slug===x.slug)).map(r=>({identifier:r.id||String(r.slug),source:null,record:r,local:false}))];
 function start(item:{identifier:string;source:Profile|Specialty|null;record:AnyRecord|undefined}){
  const r=item.record;const source=item.source;
  const p=team?source as Profile|undefined:undefined;
  const s=!team?source as Specialty|undefined:undefined;
  setEditing(item.identifier);
  setForm(team?{
   id:String(r?.id||builtinProfileId(item.identifier)||''),
   name_ar:String(r?.name_ar||p?.nameAr||''),name_en:String(r?.name_en||p?.nameEn||''),
   title_ar:String(r?.title_ar||p?.titleAr||''),title_en:String(r?.title_en||p?.titleEn||''),
   bio_ar:String(r?.bio_ar||p?.summaryAr||''),bio_en:String(r?.bio_en||p?.summaryEn||''),
   department:String(r?.department||p?.department||'women'),
   category:(()=>{const link=relations.find(x=>x.specialist_id===r?.id);const service=specialtyRows.find(x=>x.id===link?.specialty_id);return specialties.find(s=>s.slug===service?.slug)?.category||p?.category||'physical'})(),
   qualifications:r?toLines(r.qualifications):p?.qualifications.join('\n')||'',
   conditions_ar:r?toLines(r.conditions_ar):p?.services.join('\n')||'',
   image_url:String(r?.image_url||p?.photo||'')
  }:{
   id:String(r?.id||''),slug:String(r?.slug||s?.slug||''),
   name_ar:String(r?.name_ar||s?.nameAr||''),name_en:String(r?.name_en||s?.nameEn||''),
   description_ar:String(r?.description_ar||s?.introAr||''),description_en:String(r?.description_en||s?.introEn||''),
   image_url:String(r?.image_url||s?.image||'')
  });
  setFile(null);setPublished(r?.is_published??true);setError('');setNotice('');
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function reset(){setEditing(null);setForm({});setFile(null);setPublished(true)}
 function field(k:string,label:string,multiline=false,required=false){return <div key={k}><label htmlFor={'catalog-'+k} className="label">{label}</label>{multiline?<textarea id={'catalog-'+k} rows={3} className="field" value={form[k]||''} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/>:<input id={'catalog-'+k} className="field" required={required} dir={k.endsWith('_en')?'ltr':undefined} value={form[k]||''} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/>}</div>}
 async function importBundled(){
  if(!owner)return;
  setBusy(true);setError('');setNotice('');
  try{
   // The server imports missing records and activates the catalog as ONE atomic Blob write.
   // This is safe to retry, and it never overwrites existing photos or edited records.
   const response=await fetch('/api/admin/catalog-import',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({module})
   });
   const result=await response.json().catch(()=>({error:'تعذر قراءة رد الخادم'}));
   if(!response.ok)throw new Error(result.error||'تعذر إتمام الاستيراد');
   await reload();
   const counts=`${result.addedProfiles||0} أخصائيين، ${result.addedSpecialties||0} تخصصات`;
   setNotice(`اكتمل الاستيراد والتفعيل بنجاح. أُضيف: ${counts}. السجلات السابقة وصورها محفوظة، ويمكنك الآن التعديل والنشر.`);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function save(e:React.FormEvent){
  e.preventDefault();if(!allowed)return;setBusy(true);setError('');setNotice('');
  try{
   const db=createClient();const image=file?await uploadPublicImage(file,team?'specialists':'specialties'):form.image_url.trim();
   if(!isAllowedImageUrl(image))throw new Error('استخدم رابط HTTPS أو مسار صورة داخل الموقع. الصور المرفوعة من جهازك تُقبل تلقائياً.');
   const payload:Record<string,unknown>=team?{
    name_ar:form.name_ar.trim(),name_en:form.name_en.trim(),title_ar:form.title_ar.trim(),title_en:form.title_en.trim(),
    bio_ar:form.bio_ar.trim(),bio_en:form.bio_en.trim(),department:form.department||'women',
    qualifications:fromLines(form.qualifications||''),conditions_ar:fromLines(form.conditions_ar||''),
    image_url:image||null,is_published:published
   }:{
    slug:form.slug.trim(),name_ar:form.name_ar.trim(),name_en:form.name_en.trim(),
    description_ar:form.description_ar.trim(),description_en:form.description_en.trim(),
    image_url:image||null,is_published:published
   };
   if(!payload.name_ar||!payload.name_en)throw new Error('الاسم بالعربية والإنجليزية مطلوب');
   if(!team&&!/^[a-z0-9-]{2,80}$/.test(String(payload.slug)))throw new Error('رابط التخصص يجب أن يكون حروفاً إنجليزية صغيرة وأرقاماً وشرطات');
   // New profiles without a legacy record get a stable UUID for reliable merging.
   if(team){
    const existing=rows.find(r=>r.id===form.id);
    const fallback=profileById(form.id);
    if(existing){const {error}=await db.from('specialists').update(payload).eq('id',existing.id);if(error)throw error}
    const newId=fallback?form.id:crypto.randomUUID();
    if(!existing){const {error}=await db.from('specialists').insert({...payload,id:newId,languages:[],conditions_en:[]});if(error)throw error}
    const savedId=existing?.id||newId;
    const chosen=specialties.find(s=>s.category===form.category);
    const storedService=specialtyRows.find(s=>s.slug===chosen?.slug);
    if(savedId&&storedService){
      const {error:removeError}=await db.from('specialist_specialties').delete().eq('specialist_id',savedId);if(removeError)throw removeError;
      const {error:linkError}=await db.from('specialist_specialties').insert({specialist_id:savedId,specialty_id:storedService.id});if(linkError)throw linkError;
    }
   }else{
    const existing=rows.find(r=>r.id===form.id&&!!form.id);
    if(existing){const {error}=await db.from('specialties').update(payload).eq('id',existing.id);if(error)throw error}
    else {const {error}=await db.from('specialties').insert(payload);if(error)throw error}
   }
   await reload();reset();setNotice('تم حفظ التغييرات. ستظهر على الموقع بعد النشر أو تحديث الصفحة، إذا كان الكتالوج مفعلاً.');
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 async function toggle(item:{identifier:string;source:Profile|Specialty|null;record:AnyRecord|undefined}){
  if(!mode[module]){setError('فعّل كتالوج قاعدة البيانات أولاً من زر الاستيراد حتى لا تعود البطاقات المخفية من النسخة الاحتياطية.');return}
  const r=item.record;if(!r?.id){setError('هذا الملف لم يُستورد بعد؛ استورد الملفات أولاً.');return}
  try{const {error}=await createClient().from(key).update({is_published:!r.is_published}).eq('id',r.id);if(error)throw error;await reload()}catch(e){setError((e as Error).message)}
 }
 if(!allowed)return <div className="card p-7">ليس لديك صلاحية إدارة {team?'الأخصائيين':'التخصصات'}.</div>;
 return <div className="space-y-6">
 <div className="card p-6 flex flex-wrap gap-4 items-center justify-between"><div><h2 className="text-xl font-extrabold">{team?'فريق المركز والصور الشخصية':'صور وبطاقات التخصصات'}</h2><p className="text-sm text-slate-600 mt-2">{mode[module]?'الكتالوج متصل بقاعدة البيانات. التحكم في النشر والصور متاح.':'الملفات الرسمية موجودة في نسخة الموقع. استورد الملفات لتفعيل الإدارة مباشرة. يمكنك إعادة الاستيراد بأمان لاستكمال أي ملفات ناقصة.'}</p></div><div className="flex gap-2 flex-wrap">{owner&&<button disabled={busy} type="button" onClick={importBundled} className="button-primary"><UploadCloud size={18}/>{busy?'جارٍ الاستيراد...':mode[module]?'فحص واستكمال الاستيراد':team?'استيراد الفريق الرسمي (10 ملفات)':'استيراد التخصصات (7)'}</button>}<button className="button-outline !px-3" onClick={()=>setFresh(x=>x+1)}><RefreshCw size={18}/>تحديث</button></div></div>
 {error&&<div role="alert" className="p-4 rounded-xl text-red-800 bg-red-50">{error}</div>}{notice&&<div role="status" className="p-4 rounded-xl text-emerald-800 bg-emerald-50">{notice}</div>}
 <div className="grid xl:grid-cols-[.85fr_1.15fr] gap-6 items-start">
 <div className="card p-6 xl:sticky xl:top-5"><h3 className="text-xl font-bold mb-4">{editing?'تعديل بيانات وصورة':'إضافة ملف جديد'}</h3><form onSubmit={save} className="space-y-4">
 {!team&&field('slug','الرابط المختصر بالإنجليزية (slug)',false,true)}
 {field('name_ar',team?'الاسم بالعربية':'اسم التخصص بالعربية',false,true)}{field('name_en','English name',false,true)}
 {team?<>{field('title_ar','المسمى الوظيفي بالعربية')}{field('title_en','English title')}{field('bio_ar','نبذة عربية',true)}{field('bio_en','English biography',true)}{field('qualifications','المؤهلات والخبرات — كل سطر مستقل',true)}{field('conditions_ar','الخدمات والحالات — كل سطر مستقل',true)}<div><label className="label">القسم</label><select className="field" value={form.department||'women'} onChange={e=>setForm(x=>({...x,department:e.target.value}))}><option value="women">النساء</option><option value="men">الرجال</option></select></div><div><label className="label">التخصص الرئيسي (للتصفية في الحجز)</label><select className="field" value={form.category||'physical'} onChange={e=>setForm(x=>({...x,category:e.target.value}))}>{specialties.map(s=><option key={s.category} value={s.category}>{s.nameAr}</option>)}</select><p className="text-xs text-slate-500 mt-1">لربط الأخصائي المضاف حديثاً بالتخصص يجب استيراد التخصصات من لوحة الإدارة أولاً.</p></div></>:<>{field('description_ar','الوصف بالعربية',true)}{field('description_en','English description',true)}</>}
 <div className="rounded-2xl border border-[#eedce9] bg-[#fbf7fa] p-4"><label className="label flex gap-2 items-center"><ImagePlus size={18}/> {team?'الصورة الشخصية للأخصائي':'صورة التخصص بدلاً من الأيقونة'}</label><p className="text-xs text-slate-600 mb-3">اختر صورة JPG/PNG/WebP/AVIF واضحة بحجم لا يتجاوز 5 ميجابايت. عند الحفظ تحل محل القديمة مع بقاء الصورة الأصلية كنسخة في المشروع.</p><input aria-label="رفع الصورة" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field" onChange={e=>setFile(e.target.files?.[0]||null)}/>{field('image_url','أو رابط صورة HTTPS / مسار داخلي (اختياري)')}<p className="text-xs text-slate-500 mt-2">عند اختيار صورة من جهازك تُستخدم تلقائياً بدلاً من الرابط الموجود، فلا تحتاج إلى حذف مسار الصورة القديمة.</p><div className="mt-3 rounded-xl bg-white border border-[#eee7ed] overflow-hidden h-44 flex items-center justify-center">{(preview||form.image_url)?<img src={preview||form.image_url} alt="معاينة الصورة" className="max-h-full max-w-full object-contain"/>:<span className="text-xs text-slate-500">بدون صورة، ستظهر الأيقونة التفاعلية</span>}</div></div>
 <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/>إظهار هذا الملف على الموقع</label>
 <div className="flex flex-wrap gap-2"><button className="button-primary" disabled={busy}><Save size={18}/>{busy?'جارٍ الحفظ...':'حفظ التعديلات'}</button><button type="button" className="button-outline" onClick={reset}>ملف جديد / إلغاء</button></div></form></div>
 <div className="card p-6"><h3 className="text-xl font-bold mb-4">{team?'الأخصائيون والأخصائيات':'التخصصات'} ({display.length})</h3><div className="grid gap-3">{display.map(item=>{
  const r=item.record;const p=item.source as Profile|null;const s=item.source as Specialty|null;
  const name=String(r?.name_ar||(team?p?.nameAr:s?.nameAr)||'ملف جديد');
  const image=String(r?.image_url||(team?p?.photo:s?.image)||'');
  const isVisible=r?.is_published??true;
  return <div key={item.identifier} className="rounded-2xl border border-[#eee7ed] p-3 flex gap-4 items-center flex-wrap"><div className="h-20 w-20 shrink-0 rounded-xl bg-[#fbf4f9] overflow-hidden flex items-center justify-center">{image?<img src={image} alt={name} className="h-full w-full object-contain"/>:<ImagePlus className="text-[#8d517a]"/>}</div><div className="flex-1 min-w-[145px]"><strong className="block text-sm">{name}</strong><span className="text-xs text-slate-500">{r?(isVisible?'منشور':'مخفي'):'من ملفات المركز (غير مستورد)'}</span></div><div className="flex gap-2 flex-wrap"><button className="button-outline !p-2 !min-h-[38px]" onClick={()=>start(item)} aria-label={'تعديل '+name}>تعديل</button><button className="button-outline !p-2 !min-h-[38px]" onClick={()=>toggle(item)} disabled={!mode[module]} aria-label={(isVisible?'إخفاء ':'إظهار ')+name}>{isVisible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
 })}</div></div></div></div>;
}
