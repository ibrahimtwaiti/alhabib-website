'use client';
import {useEffect,useState} from 'react';
import {ExternalLink,Link2,RotateCcw,Save} from 'lucide-react';
import {FaInstagram,FaXTwitter,FaSnapchat,FaTiktok} from 'react-icons/fa6';
import {createClient} from '@/lib/cms-client';
import {DEFAULT_SOCIAL_LINKS,getSocialLinks,isValidSocialProfileUrl,socialHandle,SOCIAL_LINKS_KEY,SOCIAL_PLATFORMS,type SocialLinks,type SocialPlatform} from '@/lib/social-links';

type AdminProfile={role?:string;permissions?:Record<string,boolean>};
const networks=[
 {key:'instagram',name:'Instagram',nameAr:'إنستغرام',Icon:FaInstagram},
 {key:'x',name:'X (Twitter)',nameAr:'إكس',Icon:FaXTwitter},
 {key:'snapchat',name:'Snapchat',nameAr:'سناب شات',Icon:FaSnapchat},
 {key:'tiktok',name:'TikTok',nameAr:'تيك توك',Icon:FaTiktok}
] as const;

export default function AdminSocialLinks({profile}:{profile:AdminProfile}){
 const permitted=profile.role==='super_admin'||profile.permissions?.settings===true;
 const [values,setValues]=useState<SocialLinks>({...DEFAULT_SOCIAL_LINKS});
 const [saved,setSaved]=useState<SocialLinks>({...DEFAULT_SOCIAL_LINKS});
 const [loading,setLoading]=useState(true);
 const [loaded,setLoaded]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');

 async function load(){
  setLoading(true);setLoaded(false);setError('');setNotice('');
  try{
   const {data,error:loadError}=await createClient().from('site_settings').select('value').eq('key',SOCIAL_LINKS_KEY).maybeSingle();
   if(loadError)throw loadError;
   const current=getSocialLinks(data?.value);
   setValues({...current});setSaved({...current});setLoaded(true);
  }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل روابط التواصل');}
  finally{setLoading(false)}
 }
 useEffect(()=>{if(permitted)void load();},[permitted]);
 function change(platform:SocialPlatform,url:string){
  setValues(current=>({...current,[platform]:url}));setNotice('');setError('');
 }
 const modified=SOCIAL_PLATFORMS.some(platform=>values[platform]!==saved[platform]);
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!permitted||saving||!modified)return;
  const next={...values};
  for(const platform of SOCIAL_PLATFORMS){
   next[platform]=next[platform].trim();
   if(!isValidSocialProfileUrl(platform,next[platform])){
    const name=networks.find(x=>x.key===platform)?.name||platform;
    setError('رابط '+name+' غير صالح. استخدم رابط HTTPS مباشر لصفحة الحساب على المنصة الصحيحة.');
    return;
   }
  }
  setSaving(true);setError('');setNotice('');
  try{
   const {error:saveError}=await createClient().from('site_settings').upsert({
    key:SOCIAL_LINKS_KEY,value:next,is_public:true
   },{onConflict:'key'});
   if(saveError)throw saveError;
   setValues(next);setSaved({...next});
   setNotice('تم حفظ روابط حسابات المركز ونشرها بنجاح. تظهر في تذييل الموقع عند تحديث الصفحة.');
  }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ روابط التواصل');}
  finally{setSaving(false);}
 }
 if(!permitted)return <div className="card p-6">تحتاج إلى صلاحية إعدادات الموقع لتعديل حسابات التواصل.</div>;
 return <section className="card p-6 mt-6 max-w-5xl" aria-label="حسابات التواصل الاجتماعي">
  <div className="flex items-start gap-3">
   <span className="rounded-xl bg-[#eaf7f1] text-[#327f70] p-3"><Link2 size={22}/></span>
   <div><h2 className="text-xl font-extrabold text-[#57585a]">حسابات التواصل الاجتماعي</h2>
    <p className="text-sm text-slate-600 leading-7 mt-1">إدارة الروابط الرسمية التي تظهر بأيقوناتها في أسفل الموقع. اترك الرابط فارغًا لإخفاء المنصة، أو أدخل رابط حسابها لعرضه مجددًا.</p>
   </div>
  </div>
  {loading?<div className="py-8 text-slate-500" role="status">جارٍ تحميل روابط التواصل المعتمدة...</div>:!loaded?<div className="mt-5"><p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error||"تعذر تحميل الروابط المعتمدة"}</p><button type="button" className="button-outline mt-3" onClick={()=>void load()}>إعادة المحاولة</button></div>:
  <form onSubmit={save} className="mt-6 space-y-4">
   <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{networks.map(({key,name,nameAr,Icon})=>
    <div key={key} className={"rounded-2xl border p-4 md:p-5 min-w-0 "+(key==="instagram"?"bg-white border-[#d8bdcf] shadow-sm xl:col-span-2":"bg-[#fcfafc] border-[#e8e3e7]")}>
     <label htmlFor={'social-'+key} className="font-bold text-sm flex flex-wrap gap-2 items-center text-[#57585a]"><Icon size={20} aria-hidden="true"/>{key==='instagram'?'رابط حساب إنستغرام':nameAr} <span dir="ltr" className="text-slate-500 font-normal">({name})</span></label>
     {key==='instagram'&&<p className="text-xs text-slate-600 mt-2">يمكنك تعديل رابط حساب إنستغرام من الحقل التالي، ثم الضغط على «حفظ ونشر الحسابات» أسفل الصفحة.</p>}
     <input id={'social-'+key} name={'social-'+key} aria-label={'رابط حساب '+nameAr} type="url" inputMode="url" dir="ltr" autoComplete="off" spellCheck={false}
      className="field mt-3 block w-full min-w-0 !bg-white !text-[#3b333a] !border-2 !border-[#c8b4c3] focus:!border-[#8d517a] !min-h-[52px] shadow-sm" placeholder={DEFAULT_SOCIAL_LINKS[key]}
      value={values[key]} onChange={e=>change(key,e.target.value)} maxLength={500}
      aria-invalid={!isValidSocialProfileUrl(key,values[key])}/>
     {values[key].trim()&&isValidSocialProfileUrl(key,values[key])?
      <a href={values[key].trim()} rel="noopener noreferrer" target="_blank" dir="ltr" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#327f70] hover:underline">
       <ExternalLink size={14}/>{socialHandle(key,values[key])} — اختبار الرابط
      </a>:<p className="text-xs text-slate-500 mt-3">{values[key].trim()?'تحقق من رابط الحساب.':'لن تظهر هذه المنصة لزوار الموقع.'}</p>}
    </div>
   )}</div>
   {error&&<p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</p>}
   {notice&&<p role="status" className="rounded-xl bg-emerald-50 text-emerald-800 p-3 text-sm">{notice}</p>}
   <div className="flex flex-wrap gap-3 pt-2">
    <button type="submit" disabled={saving||!modified} className="button-primary"><Save size={18}/>{saving?'جارٍ الحفظ...':'حفظ ونشر الحسابات'}</button>
    <button type="button" disabled={saving||!modified} className="button-outline" onClick={()=>{setValues({...saved});setError('');setNotice('');}}><RotateCcw size={17}/>التراجع عن التغييرات</button>
   </div>
  </form>}
 </section>
}
