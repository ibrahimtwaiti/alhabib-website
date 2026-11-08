'use client';
import {useEffect,useState} from 'react';
import {Eye,RefreshCw,Save} from 'lucide-react';
import {createClient} from '@/lib/cms-client';
import {ABOUT_CONTENT_KEY,DEFAULT_ABOUT_CONTENT,getAboutContent,type AboutContent} from '@/lib/about-content';

type AdminProfile={role?:string;permissions?:Record<string,boolean>};
const sections=[
 {name:'عنوان الصفحة ومقدمتها',fields:[
  ['pageTitleAr','عنوان الصفحة بالعربية',150],['pageTitleEn','Page title in English',150],
  ['subtitleAr','الوصف أسفل عنوان الصفحة',500],['subtitleEn','Page subtitle in English',500]]},
 {name:'المحتوى التعريفي',fields:[
  ['eyebrowAr','التسمية الصغيرة فوق العنوان',90],['eyebrowEn','Section eyebrow (English)',90],
  ['headingAr','العنوان الرئيسي بالعربية',150],['headingEn','Main heading in English',150],
  ['bodyAr','نبذة المركز بالعربية',2500],['bodyEn','About text in English',2500]]},
 {name:'بطاقة الرسالة',fields:[
  ['cardTitleAr','عنوان البطاقة بالعربية',150],['cardTitleEn','Card title in English',150],
  ['cardBodyAr','نص البطاقة بالعربية',1200],['cardBodyEn','Card text in English',1200]]}
] as const;

export default function AdminAbout({profile}:{profile:AdminProfile}){
 const permitted=profile.role==='super_admin'||profile.permissions?.settings===true;
 const [values,setValues]=useState<AboutContent>({...DEFAULT_ABOUT_CONTENT});
 const [saved,setSaved]=useState<AboutContent>({...DEFAULT_ABOUT_CONTENT});
 const [loaded,setLoaded]=useState(false);
 const [saving,setSaving]=useState(false);
 const [previewLang,setPreviewLang]=useState<'ar'|'en'>('ar');
 const [notice,setNotice]=useState('');const [error,setError]=useState('');
 async function load(){
  setLoaded(false);
  try{
   const {data,error}=await createClient().from('site_settings').select('value').eq('key',ABOUT_CONTENT_KEY).maybeSingle();
   if(error)throw error;
   const next=getAboutContent(data?.value);
   setValues(next);setSaved(next);setError('');setLoaded(true);
  }catch(e){setError((e as Error).message||'تعذر تحميل من نحن')}
 }
 useEffect(()=>{if(permitted)void load()},[permitted]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!permitted||saving)return;
  const trimmed={} as AboutContent;
  for(const part of sections)for(const [key,,max] of part.fields){
   const value=values[key].trim();
   if(!value||value.length>max){setError('راجع الحقول المطلوبة وطول النص قبل الحفظ.');return}
   trimmed[key]=value;
  }
  setSaving(true);setError('');setNotice('');
  try{
   const {error}=await createClient().from('site_settings').upsert({
    key:ABOUT_CONTENT_KEY,value:trimmed,is_public:true
   },{onConflict:'key'});
   if(error)throw error;
   setSaved(trimmed);setValues(trimmed);
   setNotice('تم نشر تحديث «من نحن» بنجاح. يظهر المحتوى الجديد في الصفحة العامة عند فتحها أو تحديثها.');
  }catch(e){setError((e as Error).message||'تعذر حفظ من نحن')}
  finally{setSaving(false)}
 }
 if(!permitted)return <div className="card p-6">هذا القسم يتطلب صلاحية إعدادات الموقع.</div>;
 if(!loaded)return <div role="status" className="card p-6">{error?<p className="text-red-700">{error}</p>:<p>جارٍ تحميل محتوى «من نحن» المنشور من قاعدة البيانات...</p>}<button className="button-outline mt-3" type="button" onClick={()=>void load()}><RefreshCw size={16}/>إعادة المحاولة</button></div>;
 const pick=(ar:keyof AboutContent,en:keyof AboutContent)=>values[previewLang==='ar'?ar:en];
 const changed=JSON.stringify(values)!==JSON.stringify(saved);
 return <div className="space-y-5">
  <div className="card p-5 flex flex-wrap justify-between items-center gap-3">
   <div><h2 className="text-xl font-extrabold">إدارة صفحة «من نحن»</h2><p className="text-sm text-slate-600 mt-2">عدل العناوين والنصوص بالعربية والإنجليزية، وراجع شكلها قبل النشر. كل تعديل يُحفظ ضمن سجل المراجعات.</p></div>
   <a href="/about" target="_blank" rel="noopener noreferrer" className="button-outline"><Eye size={17}/>فتح الصفحة العامة</a>
  </div>
  {error&&<div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</div>}
  {notice&&<div role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</div>}
  <div className="grid xl:grid-cols-[1.1fr_.9fr] gap-5 items-start">
   <form className="space-y-4" onSubmit={save}>
    {sections.map(group=><section className="card p-5 space-y-4" key={group.name}>
     <h3 className="text-lg font-bold">{group.name}</h3>
     {group.fields.map(([key,label,max])=><div key={key}>
      <label className="label" htmlFor={'about-'+key}>{label}</label>
      {key.toLowerCase().includes('body')||key==='bodyAr'||key==='bodyEn'?
       <textarea id={'about-'+key} dir={key.endsWith('En')?'ltr':'rtl'} className="field resize-y" rows={5} required maxLength={max} value={values[key]} onChange={e=>setValues(x=>({...x,[key]:e.target.value}))}/>:
       <input id={'about-'+key} dir={key.endsWith('En')?'ltr':'rtl'} className="field" required maxLength={max} value={values[key]} onChange={e=>setValues(x=>({...x,[key]:e.target.value}))}/>}
      <div className="text-xs text-slate-400 mt-1" dir="ltr">{values[key].length}/{max}</div>
     </div>)}
    </section>)}
    <div className="card p-5 flex flex-wrap gap-3">
     <button type="submit" disabled={saving||!changed} className="button-primary"><Save size={18}/>{saving?'جارٍ النشر...':'حفظ ونشر التعديلات'}</button>
     <button type="button" disabled={saving||!changed} onClick={()=>setValues({...saved})} className="button-outline">إلغاء التعديلات</button>
    </div>
   </form>
   <div className="card p-5 xl:sticky xl:top-5">
    <div className="flex flex-wrap gap-3 justify-between items-center mb-4"><h3 className="font-bold">معاينة فورية للنصوص</h3><select aria-label="لغة المعاينة" className="field !w-auto" value={previewLang} onChange={e=>setPreviewLang(e.target.value as 'ar'|'en')}><option value="ar">العربية</option><option value="en">English</option></select></div>
    <div dir={previewLang==='ar'?'rtl':'ltr'} className="rounded-2xl border border-[#eee7ed] overflow-hidden">
     <div className="p-6 bg-[#faf8fa]"><h2 className="text-2xl font-extrabold">{pick('pageTitleAr','pageTitleEn')}</h2><p className="leading-8 text-sm text-slate-600 mt-3 whitespace-pre-line">{pick('subtitleAr','subtitleEn')}</p></div>
     <div className="p-6"><span className="text-xs font-bold text-[#8d517a]">{pick('eyebrowAr','eyebrowEn')}</span><h3 className="text-xl font-extrabold mt-3">{pick('headingAr','headingEn')}</h3><p className="mt-3 text-sm text-slate-600 leading-8 whitespace-pre-line">{pick('bodyAr','bodyEn')}</p></div>
     <div className="p-6 bg-[#8d517a] text-white"><h3 className="font-extrabold text-lg">{pick('cardTitleAr','cardTitleEn')}</h3><p className="mt-3 text-sm leading-8 whitespace-pre-line">{pick('cardBodyAr','cardBodyEn')}</p></div>
    </div>
    <p className="text-xs text-slate-500 mt-4">المعاينة خاصة بلوحة الإدارة؛ لا تتغير الصفحة المنشورة حتى تضغط حفظ ونشر.</p>
   </div>
  </div>
 </div>;
}
