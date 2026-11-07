'use client';
import {useEffect,useState} from 'react';
import {ImagePlus,Save,RefreshCw,Trash2} from 'lucide-react';
import {createClient} from '@/lib/cms-client';
import {uploadPublicImage} from '@/components/admin-catalog';
import {VISUAL_KEY,visualFields,type SiteVisuals} from '@/components/use-site-visuals';
import {isAllowedImageUrl} from '@/lib/image-urls';

type Profile={role?:string;permissions?:Record<string,boolean>};
type VisualKey=(typeof visualFields)[number][0];
export default function AdminVisuals({profile}:{profile:Profile}){
 const allowed=profile.role==='super_admin'||profile.permissions?.settings===true;
 const [visuals,setVisuals]=useState<SiteVisuals>({});
 const [drafts,setDrafts]=useState<SiteVisuals>({});
 const [busy,setBusy]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');
 async function reload(){
  const {data,error}=await createClient().from('site_settings').select('value').eq('key',VISUAL_KEY).maybeSingle();
  if(error)throw error;
  const saved=(data?.value||{}) as SiteVisuals;
  setVisuals(saved);setDrafts(saved);
 }
 useEffect(()=>{if(allowed)void reload().catch(e=>setError((e as Error).message))},[allowed]);
 async function persist(next:SiteVisuals){
  const {error}=await createClient().from('site_settings').upsert({key:VISUAL_KEY,value:next,is_public:true},{onConflict:'key'});
  if(error)throw error;
  setVisuals(next);setDrafts(next);
 }
 async function saveLink(key:VisualKey){
  if(busy)return;
  const link=(drafts[key]||'').trim();
  if(!isAllowedImageUrl(link)){setError('الرابط غير صالح؛ استخدم رابط HTTPS مباشر للصورة، وليس رابط مشاركة لصفحة ويب.');return}
  setBusy(key);setError('');setNotice('');
  try{const next={...visuals};if(link)next[key]=link;else delete next[key];await persist(next);setNotice('تم حفظ رابط الصورة. حدّث الموقع العام لرؤية النتيجة.')}
  catch(e){setError((e as Error).message||'تعذر حفظ الرابط')}
  finally{setBusy('')}
 }
 async function upload(key:VisualKey,file?:File){
  if(!file||busy)return;setBusy(key);setError('');setNotice('');
  try{const url=await uploadPublicImage(file,'site-visuals');await persist({...visuals,[key]:url});setNotice('تم رفع الصورة وحفظها.')}
  catch(e){setError((e as Error).message||'تعذر رفع الصورة')}
  finally{setBusy('')}
 }
 async function clear(key:VisualKey){
  if(busy)return;setBusy(key);setError('');setNotice('');
  try{const next={...visuals};delete next[key];await persist(next);setNotice('عادت الصورة الافتراضية لهذا العنصر.')}
  catch(e){setError((e as Error).message||'تعذر الاستعادة')}
  finally{setBusy('')}
 }
 async function saveHeroFraming(){
  if(busy)return;
  setBusy('hero-framing');setError('');setNotice('');
  try{
   const next:SiteVisuals={...visuals,
    heroFit:drafts.heroFit==='contain'?'contain':'cover',
    heroPositionX:Math.min(100,Math.max(0,Math.round(Number(drafts.heroPositionX ?? 50)))),
    heroPositionY:Math.min(100,Math.max(0,Math.round(Number(drafts.heroPositionY ?? 50))))
   };
   await persist(next);
   setNotice('تم حفظ حجم الصورة الرئيسية وتمركزها. حدّث الموقع العام لمراجعة التغيير.');
  }catch(e){setError((e as Error).message||'تعذر حفظ إعدادات الصورة')}
  finally{setBusy('')}
 }
 if(!allowed)return <div className="card p-6">تحتاج إلى صلاحية إعدادات الموقع لتغيير الصور العامة.</div>;
 return <div className="space-y-5">
  <div className="card p-6"><h2 className="text-xl font-bold">الهوية البصرية والصور والأيقونات — روابط مباشرة</h2>
  <p className="text-sm mt-2 text-slate-600">ضع رابط HTTPS مباشر لأي صورة ثم احفظه لتغيير الشعار والصورة الرئيسية والأيقونات. لا يحتاج تغيير الرابط إلى رفع ملف من الجهاز.</p>
  <button type="button" className="button-outline mt-4 !p-2" onClick={()=>void reload().catch(e=>setError((e as Error).message))}><RefreshCw size={17}/>تحديث البيانات</button></div>
  {error&&<div role="alert" className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}
  {notice&&<div role="status" className="p-4 rounded-xl bg-green-50 text-green-800">{notice}</div>}
  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visualFields.map(([key,label])=>
   <div key={key} className="card p-5">
    <h3 className="font-bold mb-4">{label}</h3>
    <div className={(key==='hero'?'aspect-square':'h-40')+' rounded-2xl bg-[#f4f4f4] border border-[#eee7ed] flex items-center justify-center overflow-hidden'}>
     {(drafts[key]||key==='hero')?<img src={drafts[key]||'/assets/team/heba-alhabib.webp'} alt={label} className="h-full w-full" style={{objectFit:key==='hero'?(drafts.heroFit==='contain'?'contain':'cover'):'contain',objectPosition:key==='hero'?`${drafts.heroPositionX ?? 50}% ${drafts.heroPositionY ?? 50}%`:'center'}} onError={e=>{e.currentTarget.style.opacity='0.28'}}/>:<div className="grid place-items-center gap-2 text-slate-400"><ImagePlus size={42}/><span className="text-xs">العنصر الافتراضي</span></div>}
    </div>
    <label className="label mt-4" htmlFor={'visual-url-'+key}>رابط الصورة المباشر (HTTPS)</label>
    <input id={'visual-url-'+key} aria-label={'رابط '+label} dir="ltr" inputMode="url" className="field !text-xs" placeholder="https://example.com/image.png" value={drafts[key]||''} disabled={!!busy} onChange={e=>setDrafts(x=>({...x,[key]:e.target.value}))}/>
    <p className="text-[11px] mt-2 text-slate-500">رابط مباشر لصورة عامة، وليس رابط صفحة مشاركة.</p>
    <div className="flex flex-wrap items-center gap-2 mt-3"><button type="button" disabled={!!busy} className="button-primary !px-3 !py-2 !min-h-[38px]" onClick={()=>void saveLink(key)}><Save size={15}/>{busy===key?'جارٍ الحفظ':'حفظ الرابط'}</button>
     <button type="button" disabled={!!busy||(!visuals[key]&&!drafts[key])} className="button-outline !px-3 !py-2 !min-h-[38px]" onClick={()=>void clear(key)}><Trash2 size={14}/>افتراضي</button></div>
    <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer">اختياري: رفع صورة من الجهاز</summary>
     <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field !text-xs mt-2" disabled={!!busy} onChange={e=>{const file=e.target.files?.[0];void upload(key,file);e.target.value=''}}/>
    </details>
    {key==='hero'&&<div className="mt-5 rounded-2xl border border-[#e9e0e8] p-4 bg-[#fcfafc] space-y-3">
     <h4 className="font-bold text-sm">التحكم بحجم الصورة الرئيسية وتمركزها</h4>
     <p className="text-xs text-slate-600">الوضع الافتراضي «ملء الإطار» يعرض الصورة على كامل المربع دون تشويه. قد يقص أطرافها؛ حرّك نقطة التركيز لموازنة القص.</p>
     <label className="label" htmlFor="hero-fit">طريقة العرض</label>
     <select id="hero-fit" className="field" disabled={!!busy} value={drafts.heroFit||'cover'} onChange={e=>setDrafts(x=>({...x,heroFit:e.target.value==='contain'?'contain':'cover'}))}><option value="cover">ملء الإطار (بدون فراغات)</option><option value="contain">الصورة كاملة (قد تظهر هوامش)</option></select>
     <label className="label" htmlFor="hero-position-x">التمركز الأفقي: {drafts.heroPositionX ?? 50}%</label>
     <input id="hero-position-x" type="range" min="0" max="100" step="1" className="w-full accent-[#8d517a]" disabled={!!busy} value={drafts.heroPositionX ?? 50} onChange={e=>setDrafts(x=>({...x,heroPositionX:Number(e.target.value)}))}/>
     <label className="label" htmlFor="hero-position-y">التمركز الرأسي: {drafts.heroPositionY ?? 50}%</label>
     <input id="hero-position-y" type="range" min="0" max="100" step="1" className="w-full accent-[#8d517a]" disabled={!!busy} value={drafts.heroPositionY ?? 50} onChange={e=>setDrafts(x=>({...x,heroPositionY:Number(e.target.value)}))}/>
     <button type="button" disabled={!!busy} className="button-primary !px-4 !py-2 !min-h-[40px]" onClick={()=>void saveHeroFraming()}><Save size={16}/>{busy==='hero-framing'?'جارٍ الحفظ':'حفظ حجم وتمركز الصورة'}</button>
    </div>}
   </div>)}</div>
 </div>;
}
