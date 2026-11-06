'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react';

type Props={lang:'ar'|'en'; whatsapp:string};
const specialties=[{ar:'العلاج الطبيعي',en:'Physical Therapy'},{ar:'التأهيل الرياضي',en:'Sports Rehabilitation'},{ar:'التأهيل العصبي',en:'Neurological Rehabilitation'},{ar:'تأهيل ما بعد العمليات',en:'Post-operative Rehabilitation'},{ar:'تأهيل إصابات العظام والمفاصل',en:'Orthopedic Rehabilitation'}];
export default function BookingForm({lang,whatsapp}:Props){
 const ar=lang==='ar'; const [department,setDepartment]=useState('men'); const [specialty,setSpecialty]=useState(specialties[0].ar); const [problem,setProblem]=useState(''); const [expert,setExpert]=useState(''); const [when,setWhen]=useState('soon'); const [date,setDate]=useState(''); const [time,setTime]=useState(''); const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [consent,setConsent]=useState(false);
 const [soonMen]=useState('يُحدد الموعد من إدارة المركز'); const [nearest,setNearest]=useState('');
 useEffect(()=>{let alive=true;(async()=>{try{const db=createClient();const {data,error}=await db.from('availability_settings').select('label_ar,label_en').eq('department',department).eq('is_active',true).order('updated_at',{ascending:false}).limit(1).maybeSingle();if(alive&&!error&&data)setNearest(lang==='ar'?data.label_ar:data.label_en);else if(alive)setNearest('');}catch{if(alive)setNearest('');}})();return()=>{alive=false}},[department,lang]);
 const canSend=!!(name.trim()&&phone.trim()&&problem.trim()&&consent&&(when==='soon'||(date&&time)));
 const msg=useMemo(()=>[
  ar?'طلب موعد جديد - مركز الحبيب للعلاج الطبيعي والتأهيل الطبي':'New appointment request - Alhabib Physical Therapy & Medical Rehabilitation Center',
  `${ar?'الاسم':'Name'}: ${name}`,`${ar?'رقم الجوال':'Phone'}: ${phone}`,`${ar?'القسم':'Department'}: ${department==='men'?(ar?'الرجال':'Men'):(ar?'النساء':'Women')}`,
  `${ar?'التخصص':'Specialty'}: ${specialties.find(s=>s.ar===specialty)?.[lang]||specialty}`,`${ar?'المشكلة الصحية':'Health concern'}: ${problem}`,
  `${ar?'الأخصائي المفضل':'Preferred specialist'}: ${expert|| (ar?'لا يوجد تفضيل':'No preference')}`,
  `${ar?'الموعد':'Preferred timing'}: ${when==='soon'?(ar?'أقرب موعد متاح':'Earliest available'):`${date} - ${time}`}`,
  ar?'أرجو إفادتي بتوفر الموعد وتأكيده.':'Please let me know the availability and confirm the appointment.'
 ].join('\n'),[ar,name,phone,department,specialty,problem,expert,when,date,time,lang]);
 const submit=()=>{if(!canSend)return;const number=whatsapp.replace(/\D/g,'');if(!number){alert(ar?'رقم واتساب المركز غير مضاف بعد. يرجى التواصل مع المركز.':'The clinic WhatsApp number has not been configured yet.');return;}window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');};
 return <div className="card p-5 md:p-7" id="booking"><div className="flex items-center justify-between gap-3 mb-6"><div><span className="eyebrow">{ar?'طلب موعد':'REQUEST AN APPOINTMENT'}</span><h3 className="text-2xl font-bold mt-1">{ar?'احجز موعدك':'Request your visit'}</h3></div><span className="rounded-2xl bg-teal-50 text-teal-700 p-3"><MessageCircle/></span></div>
 <div className="grid md:grid-cols-2 gap-4">
 <div><label className="label">{ar?'القسم':'Department'}</label><select className="field" value={department} onChange={e=>setDepartment(e.target.value)}><option value="men">{ar?'قسم الرجال':'Men’s Department'}</option><option value="women">{ar?'قسم النساء':'Women’s Department'}</option></select></div>
 <div><label className="label">{ar?'التخصص':'Specialty'}</label><select className="field" value={specialty} onChange={e=>setSpecialty(e.target.value)}>{specialties.map(s=><option key={s.ar} value={s.ar}>{s[lang]}</option>)}</select></div>
 <div className="md:col-span-2"><label className="label">{ar?'ما المشكلة الصحية التي تعاني منها؟':'What health concern would you like help with?'}</label><textarea className="field min-h-24" value={problem} onChange={e=>setProblem(e.target.value)} placeholder={ar?'مثال: آلام أسفل الظهر، إصابة الركبة، صعوبة الحركة...':'e.g. lower back pain, knee injury, difficulty moving...'} /></div>
 <div><label className="label">{ar?'الأخصائي المفضل (اختياري)':'Preferred specialist (optional)'}</label><input className="field" value={expert} onChange={e=>setExpert(e.target.value)} placeholder={ar?'اكتب الاسم إن كنت تفضّل أخصائياً معيناً':'Enter a name if you have a preference'}/></div>
 <div><label className="label">{ar?'الموعد المناسب':'Preferred timing'}</label><select className="field" value={when} onChange={e=>setWhen(e.target.value)}><option value="soon">{ar?'أقرب موعد متاح':'Earliest available'}</option><option value="choose">{ar?'تحديد تاريخ ووقت':'Choose date and time'}</option></select></div>
 {when==='soon'?<div className="md:col-span-2 rounded-xl bg-teal-50 p-3 text-sm text-teal-800">{ar?'أقرب موعد: ':'Earliest availability: '}{nearest || (ar?'لم يتم تحديد موعد بعد. يرجى التواصل مع المركز.':'No earliest time has been set. Please contact the clinic.')}. <span className="block text-xs mt-1">{ar?'سيتم تأكيد الموعد عبر واتساب.':'The appointment must be confirmed via WhatsApp.'}</span></div>:<><div><label className="label">{ar?'التاريخ':'Date'}</label><input type="date" className="field" value={date} onChange={e=>setDate(e.target.value)} min={new Date().toISOString().slice(0,10)}/></div><div><label className="label">{ar?'الوقت المناسب':'Preferred time'}</label><input type="time" className="field" value={time} onChange={e=>setTime(e.target.value)}/></div></>}
 <div><label className="label">{ar?'الاسم الكامل':'Full name'}</label><input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder={ar?'اسمك الكامل':'Your full name'}/></div>
 <div><label className="label">{ar?'رقم الجوال':'Mobile number'}</label><input className="field" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="05xxxxxxxx" dir="ltr"/></div>
 </div>
 <label className="flex gap-3 items-start text-xs text-slate-600 mt-5"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 accent-teal-700"/><span>{ar?'أوافق على استخدام البيانات المدخلة لتجهيز طلب التواصل، وأفهم أن فتح واتساب لا يعني تأكيد الموعد.':'I consent to using the details above to prepare my enquiry and understand that opening WhatsApp does not confirm an appointment.'}</span></label>
 <button onClick={submit} disabled={!canSend} className="btn w-full mt-5 disabled:opacity-40 disabled:cursor-not-allowed"><MessageCircle size={18}/>{ar?'متابعة إلى واتساب':'Continue to WhatsApp'}<ArrowLeft size={17}/></button>
 <p className="flex gap-2 items-center text-xs text-slate-500 mt-3"><ShieldCheck size={15}/>{ar?'لا يتم حفظ هذا النموذج في قاعدة بيانات الموقع. يتم تجهيز الرسالة على جهازك وفتح واتساب.':'This form is not stored in the website database. The message is prepared in your browser and WhatsApp is opened.'}</p>
 </div>
}
