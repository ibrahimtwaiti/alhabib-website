'use client';
import {useEffect,useState} from 'react';
import {ImagePlus,Save,RefreshCw,Trash2} from 'lucide-react';
import {createClient} from '@/lib/supabase';
import {uploadPublicImage} from '@/components/admin-catalog';
import {VISUAL_KEY,visualFields,type SiteVisuals} from '@/components/use-site-visuals';

type Profile={role?:string;permissions?:Record<string,boolean>};
export default function AdminVisuals({profile}:{profile:Profile}){
 const allowed=profile.role==='super_admin'||profile.permissions?.settings===true;
 const [visuals,setVisuals]=useState<SiteVisuals>({});const [busy,setBusy]=useState('');
 const [error,setError]=useState('');const [notice,setNotice]=useState('');
 async function reload(){const {data,error}=await createClient().from('site_settings').select('value').eq('key',VISUAL_KEY).maybeSingle();if(error)throw error;setVisuals((data?.value||{}) as SiteVisuals)}
 useEffect(()=>{if(allowed)reload().catch(e=>setError(e.message))},[allowed]);
 async function persist(next:SiteVisuals){const {error}=await createClient().from('site_settings').upsert({key:VISUAL_KEY,value:next,is_public:true},{onConflict:'key'});if(error)throw error;setVisuals(next)}
 async function upload(k:keyof SiteVisuals,file?:File){if(!file)return;setBusy(k);setError('');setNotice('');try{const url=await uploadPublicImage(file,'site-visuals');await persist({...visuals,[k]:url});setNotice('تم حفظ الصورة الجديدة وستظهر عند إعادة تحميل الموقع.')}catch(e){setError((e as Error).message)}finally{setBusy('')}}
 async function clear(k:keyof SiteVisuals){setBusy(k);try{const next={...visuals};delete next[k];await persist(next);setNotice('تمت العودة إلى الصورة/الأيقونة الافتراضية.')}catch(e){setError((e as Error).message)}finally{setBusy('')}}
 if(!allowed)return <div className="card p-6">تحتاج إلى صلاحية إعدادات الموقع لتغيير الصور العامة.</div>;
 return <div className="space-y-5"><div className="card p-6"><h2 className="text-xl font-bold">الهوية البصرية والصور والأيقونات</h2><p className="text-sm mt-2 text-slate-600">ارفع صورة حقيقية مناسبة لتحل محل الأيقونة الافتراضية مباشرة. لصور التخصصات افتح قسم «التخصصات»، وللصور الشخصية افتح «الأخصائيون». يجب أن يكون حجم الصورة أقل من 5 ميجابايت.</p><button className="button-outline mt-4 !p-2" onClick={()=>reload().catch(e=>setError(e.message))}><RefreshCw size={17}/>تحديث البيانات</button></div>
 {error&&<div role="alert" className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}{notice&&<div role="status" className="p-4 rounded-xl bg-green-50 text-green-800">{notice}</div>}
 <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visualFields.map(([k,label])=><div key={k} className="card p-5"><h3 className="font-bold mb-4">{label}</h3><div className="h-40 rounded-2xl bg-[#fbf5fa] border border-[#eee7ed] flex items-center justify-center overflow-hidden">{visuals[k]?<img src={visuals[k]} alt={label} className="h-full w-full object-contain"/>:<div className="grid place-items-center gap-2 text-slate-400"><ImagePlus size={42}/><span className="text-xs">العنصر الافتراضي</span></div>}</div><label className="label mt-4" htmlFor={'visual-'+k}>استبدال الصورة</label><input id={'visual-'+k} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="field !text-xs" disabled={!!busy} onChange={e=>{const f=e.target.files?.[0];void upload(k,f);e.target.value=''}}/><div className="flex justify-between items-center mt-3 text-xs text-slate-500"><span>{busy===k?'جارٍ رفع الصورة...':visuals[k]?'صورة مخصصة':'الافتراضي'}</span><button disabled={!!busy||!visuals[k]} className="inline-flex items-center gap-1 text-[#8d517a] disabled:opacity-30" onClick={()=>void clear(k)}><Trash2 size={14}/>استعادة الافتراضي</button></div></div>)}</div></div>;
}
