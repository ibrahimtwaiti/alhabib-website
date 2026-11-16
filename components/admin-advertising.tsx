'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowDown,ArrowUp,GripVertical,Plus,RefreshCw,Save,Trash2} from 'lucide-react';
import {DEFAULT_AD_SETTINGS,isAdActive,PLACEMENTS,type Advertisement,type AdvertisingSnapshot,type AdSettings,type AdPlacement} from '@/lib/advertising';

const labels:Record<AdPlacement,string>={home_top:'أعلى الرئيسية أسفل القائمة',home_middle:'بين تخصصات الرئيسية ومن نحن',before_footer:'قبل التذييل',services:'صفحات التخصصات والخدمات'};
type Draft=Omit<Advertisement,'id'|'created_at'|'updated_at'>;
const empty=():Draft=>({title:'',description:'',alt:'',image_url:'',mobile_image_url:'',target_url:'',is_active:true,sort_order:0,placement:'home_top',starts_at:null,ends_at:null});
function localDate(value:string|null){
 if(!value)return '';const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function utcDate(value:string){return value?new Date(value).toISOString():null}
async function optimize(file:File,maxWidth:number){
 if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>5*1024*1024||!file.size)throw Error('اختر صورة JPG أو PNG أو WebP أو AVIF بحجم لا يتجاوز 5 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>40000000)throw Error('أبعاد الصورة كبيرة جداً؛ استخدم صورة لا تتجاوز 40 ميجابكسل.');
  const ratio=Math.min(1,maxWidth/bitmap.width,2400/bitmap.height);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  const context=canvas.getContext('2d');if(!context)throw Error('تعذر تجهيز الصورة');
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('تعذر تحسين الصورة')),'image/webp',.88));
  return new File([blob],blob.type==='image/webp'?'announcement.webp':'announcement.png',{type:blob.type});
 }finally{bitmap.close()}
}
async function upload(file:File,maxWidth:number){
 const optimized=await optimize(file,maxWidth),form=new FormData();form.append('file',optimized);
 const response=await fetch('/api/admin/upload',{method:'POST',body:form});
 const data=await response.json();if(!response.ok)throw Error(data.error||'تعذر رفع الصورة');
 return '/api/media/'+data.path;
}
function ImageField({label,value,file,onFile,onClear}:{label:string;value:string;file:File|null;onFile:(file:File|null)=>void;onClear?:()=>void}){
 const [preview,setPreview]=useState('');
 useEffect(()=>{if(!file){setPreview(value);return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file,value]);
 return <div className="rounded-2xl border border-[#8d517a25] p-4 space-y-3"><label className="label">{label}<input className="block w-full text-sm mt-3" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>onFile(e.target.files?.[0]||null)}/></label>
 {preview&&<img src={preview} alt={'معاينة '+label} className="w-full h-36 object-contain rounded-xl bg-[#faf8fa]"/>}
 {onClear&&(preview||value)&&<button type="button" className="text-sm text-red-700" onClick={onClear}>إزالة صورة الهاتف</button>}</div>;
}
export default function AdminAdvertising(){
 const [snapshot,setSnapshot]=useState<AdvertisingSnapshot|null>(null),[settings,setSettings]=useState<AdSettings>({...DEFAULT_AD_SETTINGS});
 const [draft,setDraft]=useState<Draft>(empty),[editing,setEditing]=useState<string|null>(null),[formKey,setFormKey]=useState(0);
 const [mainFile,setMainFile]=useState<File|null>(null),[mobileFile,setMobileFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[dragging,setDragging]=useState<string|null>(null);
 const lock=useRef(false),drag=useRef<string|null>(null),formRef=useRef<HTMLFormElement>(null);
 const [clock,setClock]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer)},[]);
 async function call(body?:Record<string,unknown>){
  const response=await fetch('/api/admin/advertising',{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
  const data=await response.json();if(!response.ok)throw Error(data.error||'تعذر تنفيذ العملية');return data as AdvertisingSnapshot;
 }
 function accept(data:AdvertisingSnapshot){setSnapshot(data);setSettings(data.settings)}
 async function run(task:()=>Promise<void>){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setNotice('');
  try{await task()}catch(e){setError((e as Error).message)}finally{lock.current=false;setBusy(false)}
 }
 useEffect(()=>{let live=true;call().then(data=>{if(live)accept(data)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[]);
 function reset(){setDraft(empty());setEditing(null);setMainFile(null);setMobileFile(null);setFormKey(v=>v+1)}
 function edit(ad:Advertisement){setDraft({...ad});setEditing(ad.id);setMainFile(null);setMobileFile(null);setFormKey(v=>v+1);formRef.current?.scrollIntoView({behavior:'auto',block:'start'})}
 async function save(event:FormEvent){
  event.preventDefault();
  await run(async()=>{
   if(!snapshot)return;
   if(!mainFile&&!draft.image_url)throw Error('اختر الصورة الرئيسية أولاً.');
   const image_url=mainFile?await upload(mainFile,2000):draft.image_url;
   // Retain successfully uploaded URLs when the following upload or save fails.
   setDraft(d=>({...d,image_url}));setMainFile(null);
   const mobile_image_url=mobileFile?await upload(mobileFile,1000):draft.mobile_image_url;
   setDraft(d=>({...d,mobile_image_url}));setMobileFile(null);
   const data=await call({action:'save',id:editing,revision:snapshot.revision,ad:{...draft,image_url,mobile_image_url}});
   accept(data);reset();setNotice('تم حفظ الإعلان. يظهر للزوار وفق حالة التفعيل والجدولة والموضع.');
  });
 }
 async function remove(ad:Advertisement){
  if(!window.confirm('حذف الإعلان «'+(ad.title||ad.alt)+'»؟ سيُزال من عرض الزوار.'))return;
  await run(async()=>{accept(await call({action:'delete',id:ad.id,revision:snapshot!.revision}));if(editing===ad.id)reset();setNotice('تم حذف الإعلان. إذا لم تبقَ إعلانات نشطة يختفي القسم بالكامل.')});
 }
 async function reorder(id:string,target:string){
  if(!snapshot||id===target)return;
  const ids=snapshot.ads.map(a=>a.id),from=ids.indexOf(id),to=ids.indexOf(target);
  if(from<0||to<0)return;ids.splice(from,1);ids.splice(to,0,id);
  await run(async()=>{accept(await call({action:'reorder',ids,revision:snapshot.revision}));setNotice('تم حفظ ترتيب الإعلانات تلقائياً.')});
 }
 function selectFile(file:File|null,set:(file:File|null)=>void){
  if(file&&(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>5*1024*1024)){setError('الصيغ المدعومة JPG / PNG / WebP / AVIF، والحد الأقصى 5 MB.');return}set(file);
 }
 const field=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(d=>({...d,[key]:value}));
 return <div className="space-y-6">
 <div className="card p-6 flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-bold">إدارة الإعلانات | Advertising Management</h2><p className="text-sm text-slate-600 mt-2 leading-7">عند غياب الإعلانات النشطة، يختفي القسم من الموقع بالكامل دون أي فراغ. يمكنك تحديد موضع كل إعلان وجدولته.</p></div>
 <button type="button" className="button-outline" disabled={busy} onClick={()=>run(async()=>{accept(await call());setNotice('تم تحديث القائمة.')})}><RefreshCw size={16}/>تحديث القائمة</button></div>
 {error&&<p role="alert" className="rounded-xl p-4 bg-red-50 text-red-700">{error}</p>}
 {notice&&<p role="status" className="rounded-xl p-4 bg-green-50 text-green-800">{notice}</p>}
 {!snapshot?<p role="status">{error?'استخدم «تحديث القائمة» لإعادة المحاولة.':'جارٍ تحميل الإعلانات...'}</p>:<>
 <div className="grid xl:grid-cols-2 gap-6 items-start">
 <form ref={formRef} onSubmit={save} className="card p-6" aria-label="بيانات الإعلان">
 <fieldset disabled={busy} className="space-y-4"><legend className="font-bold text-lg mb-4">{editing?'تعديل الإعلان':'إضافة إعلان جديد'}</legend>
 <div key={formKey} className="grid sm:grid-cols-2 gap-3">
 <ImageField label="الصورة الرئيسية" value={draft.image_url} file={mainFile} onFile={f=>selectFile(f,setMainFile)}/>
 <ImageField label="صورة الهاتف (اختياري)" value={draft.mobile_image_url} file={mobileFile} onFile={f=>selectFile(f,setMobileFile)} onClear={()=>{setMobileFile(null);field('mobile_image_url','');setFormKey(k=>k+1)}}/>
 </div>
 <p className="text-xs text-slate-500 leading-6">حتى 5 MB للصورة. تُحسَّن الصور تلقائياً قبل الرفع. أبعاد مقترحة: 2000 × 625 للكمبيوتر و1000 × 750 للهاتف. تُعرض الصورة كاملة دون قص.</p>
 <label className="label">عنوان الإعلان (اختياري)<input className="field mt-2" maxLength={160} value={draft.title} onChange={e=>field('title',e.target.value)}/></label>
 <label className="label">وصف مختصر (اختياري)<textarea className="field mt-2" maxLength={500} rows={3} value={draft.description} onChange={e=>field('description',e.target.value)}/></label>
 <label className="label">النص البديل للصورة<input className="field mt-2" required maxLength={250} value={draft.alt} onChange={e=>field('alt',e.target.value)}/><span className="text-xs text-slate-500">وصف واضح لمحتوى الإعلان لمستخدمي قارئات الشاشة.</span></label>
 <label className="label">رابط الإعلان (اختياري)<input className="field mt-2" dir="ltr" maxLength={2048} placeholder="https://... أو /booking" value={draft.target_url} onChange={e=>field('target_url',e.target.value)}/></label>
 <div className="grid sm:grid-cols-2 gap-4"><label className="label">موضع الإعلان<select aria-label="موضع الإعلان" className="field mt-2" value={draft.placement} onChange={e=>field('placement',e.target.value as AdPlacement)}>{PLACEMENTS.map(p=><option key={p} value={p}>{labels[p]}</option>)}</select></label>
 <label className="label">ترتيب العرض<input className="field mt-2" type="number" min={0} max={10000} required value={draft.sort_order} onChange={e=>field('sort_order',Number(e.target.value))}/></label></div>
 <p className="text-xs text-slate-500">تواريخ العرض حسب التوقيت المحلي لجهازك ({Intl.DateTimeFormat().resolvedOptions().timeZone}). اتركها فارغة للعرض دون فترة محددة.</p>
 <div className="grid sm:grid-cols-2 gap-4"><label className="label">بداية العرض<input className="field mt-2" type="datetime-local" value={localDate(draft.starts_at)} onChange={e=>field('starts_at',utcDate(e.target.value))}/></label>
 <label className="label">نهاية العرض<input className="field mt-2" type="datetime-local" value={localDate(draft.ends_at)} onChange={e=>field('ends_at',utcDate(e.target.value))}/></label></div>
 <label className="flex items-center gap-2"><input type="checkbox" checked={draft.is_active} onChange={e=>field('is_active',e.target.checked)}/>الإعلان نشط</label>
 <div className="flex flex-wrap gap-3"><button className="btn"><Save size={18}/>{busy?'جارٍ الحفظ...':'حفظ الإعلان'}</button><button type="button" className="button-outline" onClick={reset}><Plus size={16}/>{editing?'إلغاء التعديل':'تفريغ النموذج'}</button></div>
 </fieldset></form>
 <div className="card p-6 space-y-4"><h3 className="font-bold text-lg">الإعلانات ({snapshot.ads.length})</h3><p className="text-sm text-slate-500">اسحب مقبض الإعلان لترتيبه. يمكنك أيضاً استخدام أزرار التقديم والتأخير.</p>
 {snapshot.ads.length===0&&<p className="bg-[#faf8fa] rounded-xl p-5 text-sm">لم تُضف إعلانات بعد. لا تظهر أي مساحة إعلانية للزوار.</p>}
 {snapshot.ads.map((ad,i)=><article key={ad.id} data-ad-row={ad.id} className={'rounded-2xl border p-4 space-y-3 '+(dragging===ad.id?'border-[#8d517a] opacity-60':'border-slate-200')}>
 <div className="flex items-center gap-3"><button type="button" className="p-2 rounded-lg touch-none cursor-grab" disabled={busy} aria-label={'اسحب لترتيب '+(ad.title||ad.alt)} onPointerDown={e=>{drag.current=ad.id;setDragging(ad.id);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={e=>{
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-ad-row]')?.getAttribute('data-ad-row');
 const source=drag.current;drag.current=null;setDragging(null);if(source&&target)void reorder(source,target);
 }} onPointerCancel={()=>{drag.current=null;setDragging(null)}}><GripVertical size={20}/></button><img src={ad.image_url} alt="" width={90} height={60} className="w-24 h-16 object-contain bg-[#faf8fa] rounded-lg"/><div className="min-w-0 flex-1"><b className="block truncate">{ad.title||ad.alt}</b><span className="text-xs text-slate-500">{labels[ad.placement]}</span></div></div>
 <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#f7f0f5] text-[#8d517a] px-3 py-1">{!ad.is_active?'غير نشط':isAdActive(ad,clock)?'يُعرض الآن':ad.ends_at&&Date.parse(ad.ends_at)<=clock?'منتهي':'مجدول'}</span><span className="py-1 text-slate-500">الترتيب: {ad.sort_order}</span></div>
 <div className="flex flex-wrap items-center gap-2">
 <button type="button" className="button-outline !px-3 !py-2" disabled={busy} onClick={()=>edit(ad)}>تعديل</button>
 <button type="button" className="button-outline !px-3 !py-2" disabled={busy} onClick={()=>run(async()=>{accept(await call({action:'save',id:ad.id,revision:snapshot.revision,ad:{...ad,is_active:!ad.is_active}}));setNotice('تم تحديث حالة الإعلان.')})}>{ad.is_active?'تعطيل':'تفعيل'}</button>
 <button type="button" className="p-2 text-red-700" disabled={busy} aria-label={'حذف '+(ad.title||ad.alt)} onClick={()=>remove(ad)}><Trash2 size={18}/></button>
 <button type="button" className="p-2" disabled={busy||i===0} aria-label={'تقديم '+(ad.title||ad.alt)} onClick={()=>reorder(ad.id,snapshot.ads[i-1].id)}><ArrowUp size={18}/></button>
 <button type="button" className="p-2" disabled={busy||i===snapshot.ads.length-1} aria-label={'تأخير '+(ad.title||ad.alt)} onClick={()=>reorder(ad.id,snapshot.ads[i+1].id)}><ArrowDown size={18}/></button>
 </div></article>)}
 </div></div>
 <form className="card p-6" aria-label="إعدادات الحركة" onSubmit={e=>{e.preventDefault();void run(async()=>{accept(await call({action:'settings',revision:snapshot.revision,settings}));setNotice('تم حفظ إعدادات الحركة.')})}}>
 <fieldset disabled={busy} className="space-y-5"><legend className="font-bold text-lg mb-4">إعدادات الحركة والعرض</legend>
 <div className="grid md:grid-cols-3 gap-4">
 <label className="label">مدة عرض الإعلان (ثانية)<input className="field mt-2" required type="number" min={3} max={60} step={1} value={settings.interval_ms/1000} onChange={e=>setSettings(s=>({...s,interval_ms:Number(e.target.value)*1000}))}/></label>
 <label className="label">مدة الانتقال (مللي ثانية)<input className="field mt-2" required type="number" min={100} max={1500} step={50} value={settings.transition_ms} onChange={e=>setSettings(s=>({...s,transition_ms:Number(e.target.value)}))}/></label>
 <label className="label">نوع الحركة<select aria-label="نوع الحركة" className="field mt-2" value={settings.transition} onChange={e=>setSettings(s=>({...s,transition:e.target.value as AdSettings['transition']}))}><option value="fade">تلاشي ناعم</option><option value="slide">انزلاق خفيف</option><option value="none">دون حركة</option></select></label>
 </div>
 <div className="flex flex-wrap gap-6">{([['autoplay','التشغيل التلقائي'],['show_arrows','أزرار التنقل'],['show_dots','مؤشرات الصفحات']] as const).map(([key,label])=><label key={key} className="flex items-center gap-2"><input type="checkbox" checked={settings[key]} onChange={e=>setSettings(s=>({...s,[key]:e.target.checked}))}/>{label}</label>)}</div>
 <p className="text-xs text-slate-500">يتوقف التبديل أثناء التفاعل أو عند إخفاء الصفحة. تُحترم إعدادات تقليل الحركة في جهاز الزائر.</p>
 <button className="btn"><Save size={18}/>حفظ إعدادات الحركة</button>
 </fieldset></form></>}
 </div>;
}
