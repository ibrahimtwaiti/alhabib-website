'use client';
import {useEffect,useState} from 'react';
import {History,RotateCcw,RefreshCw,ShieldCheck} from 'lucide-react';
import {createClient} from '@/lib/cms-client';
type AdminProfile={role?:string};
type AuditRow={id:string;created_at?:string;actor_username?:string;table_name?:string;operation?:string;affected_count?:number};
type RevisionRow={id:string;created_at?:string;actor_username?:string;source_table?:string;source_id?:string;source_key?:string;operation?:string};
const names:Record<string,string>={specialists:'الأخصائيون',specialties:'التخصصات',site_settings:'إعدادات الصور',blog_posts:'المدونة',achievements:'الإنجازات',availability_settings:'المواعيد',dynamic_sections:'الأقسام الإضافية',specialist_specialties:'ربط التخصصات'};
const name=(key?:string)=>names[key||'']||key||'غير محدد';
const dateLabel=(value?:string)=>{if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('ar-SA',{dateStyle:'medium',timeStyle:'short'})};
export default function AdminAudit({profile}:{profile:AdminProfile}){
 const allowed=profile.role==='super_admin';
 const [events,setEvents]=useState<AuditRow[]>([]);
 const [revisions,setRevisions]=useState<RevisionRow[]>([]);
 const [tab,setTab]=useState<'events'|'revisions'>('events');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');const [notice,setNotice]=useState('');
 async function reload(){
  const db=createClient();
  const [audit,history]=await Promise.all([
   db.from('activity_logs').select('id,created_at,actor_username,table_name,operation,affected_count').order('created_at',{ascending:false}).limit(100),
   db.from('content_revisions').select('id,created_at,actor_username,source_table,source_id,source_key,operation').order('created_at',{ascending:false}).limit(100)
  ]);
  if(audit.error)throw audit.error;if(history.error)throw history.error;
  setEvents(audit.data||[]);setRevisions(history.data||[]);
 }
 useEffect(()=>{if(allowed)void reload().catch(e=>setError((e as Error).message))},[allowed]);
 async function restore(id:string){
  if(!allowed||busy||!window.confirm('هل تريد استعادة بيانات هذه النسخة؟ سيتم الاحتفاظ بالنسخة الحالية للتراجع لاحقاً.'))return;
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/admin/revisions/restore',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({revisionId:id})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'تعذرت الاستعادة');
   await reload();
   setNotice('تمت استعادة النسخة السابقة بنجاح؛ راجع الصفحة العامة وتأكد من المحتوى.');
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 if(!allowed)return <div className="card p-6">سجل التغييرات واستعادة النسخ متاحان للمدير الرئيسي فقط.</div>;
 return <div className="space-y-5">
  <div className="card p-6 flex flex-wrap gap-4 justify-between items-center"><div><h2 className="text-xl font-extrabold flex gap-2 items-center"><ShieldCheck size={24}/>سجل التعديلات والنسخ السابقة</h2><p className="text-sm mt-2 text-slate-600">يسجل نوع العملية والمسؤول دون تسجيل بيانات نماذج المرضى. تُحتفظ بنسخ محدودة من المحتوى التحريري قبل تعديله أو حذفه.</p></div><button type="button" className="button-outline" disabled={busy} onClick={()=>void reload().catch(e=>setError((e as Error).message))}><RefreshCw size={17}/>تحديث</button></div>
  {error&&<div role="alert" className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}{notice&&<div role="status" className="p-4 rounded-xl bg-emerald-50 text-emerald-800">{notice}</div>}
  <div className="flex gap-2 flex-wrap" role="tablist" aria-label="سجلات الإدارة"><button type="button" role="tab" aria-selected={tab==='events'} className={tab==='events'?'button-primary':'button-outline'} onClick={()=>setTab('events')}><History size={17}/>النشاط ({events.length})</button><button type="button" role="tab" aria-selected={tab==='revisions'} className={tab==='revisions'?'button-primary':'button-outline'} onClick={()=>setTab('revisions')}><RotateCcw size={17}/>النسخ السابقة ({revisions.length})</button></div>
  {tab==='events'?<div role="tabpanel" className="card p-5 space-y-3">{events.length===0?<p className="text-sm text-slate-500">لا يوجد سجل نشاط بعد.</p>:events.map(item=><div key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-[#eee7ed] pb-3"><div><strong className="text-sm">{name(item.table_name)} — {item.operation||'تعديل'}</strong><p className="text-xs text-slate-500 mt-1">بواسطة {item.actor_username||'المسؤول'} • {item.affected_count||1} سجل</p></div><time className="text-xs text-slate-500" dateTime={item.created_at}>{dateLabel(item.created_at)}</time></div>)}</div>
  :<div role="tabpanel" className="card p-5 space-y-3">{revisions.length===0?<p className="text-sm text-slate-500">لا توجد نسخ سابقة بعد. سيتم حفظها عند تعديل المحتوى المنشور.</p>:revisions.map(item=><div key={item.id} className="flex flex-wrap justify-between items-center gap-3 border-b border-[#eee7ed] pb-3"><div><strong className="text-sm">{name(item.source_table)}</strong><p className="text-xs text-slate-500 mt-1">قبل عملية {item.operation||'تعديل'} • {item.actor_username||'المسؤول'}</p><p className="text-xs text-slate-500 mt-1">{dateLabel(item.created_at)}</p></div><button type="button" className="button-outline !px-3 !py-2 !min-h-[38px]" disabled={busy} onClick={()=>void restore(item.id)}><RotateCcw size={15}/>استعادة النسخة</button></div>)}</div>}
 </div>;
}
