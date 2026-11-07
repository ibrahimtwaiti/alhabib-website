'use client';
import {useEffect,useMemo,useState} from 'react';
import {CalendarDays,CheckCircle2,MessageCircle,ShieldCheck} from 'lucide-react';
import {createClient} from '@/lib/cms-client';
import {tr,whatsappNumber,type Language} from '@/lib/clinic-data';
import {useClinicCatalog} from '@/components/use-clinic-catalog';
import {buildWhatsAppMessage,displayDate,displayTime,localTodayISO} from '@/lib/booking-message';

export default function BookingForm({lang}:{lang:Language}){
 const {people,services}=useClinicCatalog();
 const [department,setDepartment]=useState<'men'|'women'>('women');
 const [specialty,setSpecialty]=useState('');const [expert,setExpert]=useState('');
 const [issue,setIssue]=useState('');const [when,setWhen]=useState<'soon'|'specific'>('soon');
 const [date,setDate]=useState('');const [time,setTime]=useState('');
 const [name,setName]=useState('');const [phone,setPhone]=useState('');
 const [nearest,setNearest]=useState('');const [clinicWhatsApp,setClinicWhatsApp]=useState(whatsappNumber);
 const ar=lang==='ar';
 const specialists=useMemo(()=>people.filter(p=>p.department===department&&(!specialty||p.category===services.find(s=>s.slug===specialty)?.category||specialty==='physical-therapy'&&p.category==='physical')),[people,department,specialty,services]);
 useEffect(()=>{setExpert('')},[department,specialty]);
 useEffect(()=>{let active=true;(async()=>{try{const {data}=await createClient().from('site_settings').select('value').eq('key','whatsapp').eq('is_public',true).maybeSingle();const number=(data?.value as {number?:string}|null)?.number?.replace(/\D/g,'');if(active&&number&&/^\d{10,15}$/.test(number))setClinicWhatsApp(number)}catch{}})();return()=>{active=false}},[]);
 useEffect(()=>{let active=true;setNearest('');(async()=>{try{const {data}=await createClient().from('availability_settings').select('label_ar,label_en').eq('department',department).eq('is_active',true).order('updated_at',{ascending:false}).limit(1).maybeSingle();if(active&&data)setNearest(ar?data.label_ar:data.label_en)}catch{}})();return()=>{active=false}},[department,ar]);
 const selectedSpecialty=services.find(s=>s.slug===specialty);
 const selectedExpert=people.find(p=>p.slug===expert);
 const message=useMemo(()=>buildWhatsAppMessage({lang,name,phone,department,
   specialty:selectedSpecialty?tr(lang,selectedSpecialty.nameAr,selectedSpecialty.nameEn):'',
   specialist:selectedExpert?tr(lang,selectedExpert.nameAr,selectedExpert.nameEn):'',
   concern:issue,timing:when,date,time}),[lang,name,phone,department,selectedSpecialty,selectedExpert,issue,when,date,time]);
 const valid=!!(name.trim()&&/^\+?[\d\s()-]{8,18}$/.test(phone.trim())&&(when==='soon'||(date>=localTodayISO()&&!!displayDate(date,lang)&&!!displayTime(time,lang))));
 const send=()=>{if(!valid)return;const number=clinicWhatsApp.replace(/\D/g,'');if(!/^\d{10,15}$/.test(number))return;window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer')};
 return <section id="booking" className="booking-panel" aria-label={tr(lang,'طلب موعد','Appointment request')}>
 <div className="flex flex-wrap justify-between gap-4 items-center mb-7"><div><span className="kicker"><CalendarDays size={16}/>{tr(lang,'خطوة بسيطة نحو العناية','YOUR NEXT STEP')}</span><h2 className="text-2xl md:text-3xl font-bold mt-2">{tr(lang,'اطلب موعدك الآن','Request an appointment')}</h2></div><span className="icon-3d"><MessageCircle size={27}/></span></div>
 <div className="grid sm:grid-cols-2 gap-4">
 <div><label htmlFor="booking-dept" className="label">{tr(lang,'القسم','Department')}</label><select id="booking-dept" className="field" value={department} onChange={e=>setDepartment(e.target.value as 'men'|'women')}><option value="women">{tr(lang,'قسم النساء','Women')}</option><option value="men">{tr(lang,'قسم الرجال','Men')}</option></select></div>
 <div><label htmlFor="booking-specialty" className="label">{tr(lang,'التخصص','Specialty')}</label><select id="booking-specialty" className="field" value={specialty} onChange={e=>setSpecialty(e.target.value)}><option value="">{tr(lang,'غير محدد (اختياري)','Not specified (optional)')}</option>{services.map(s=><option key={s.slug} value={s.slug}>{tr(lang,s.nameAr,s.nameEn)}</option>)}</select></div>
 <div><label htmlFor="booking-specialist" className="label">{tr(lang,'الأخصائي/الأخصائية المفضلة','Preferred specialist')}</label><select id="booking-specialist" className="field" value={expert} onChange={e=>setExpert(e.target.value)}><option value="">{tr(lang,'بدون تفضيل','No preference')}</option>{specialists.map(p=><option key={p.slug} value={p.slug}>{tr(lang,p.nameAr,p.nameEn)}</option>)}</select></div>
 <div><label htmlFor="booking-time-choice" className="label">{tr(lang,'الموعد المناسب','Preferred timing')}</label><select id="booking-time-choice" className="field" value={when} onChange={e=>setWhen(e.target.value as 'soon'|'specific')}><option value="soon">{tr(lang,'أقرب موعد متاح','Earliest available')}</option><option value="specific">{tr(lang,'اختيار تاريخ ووقت','Choose date and time')}</option></select></div>
 {when==='specific'?<><div><label htmlFor="booking-date" className="label">{tr(lang,'التاريخ (يوم / شهر / سنة)','Date (day / month / year)')}</label><input id="booking-date" type="date" lang="en-GB" dir="ltr" className="field date-input" value={date} onChange={e=>setDate(e.target.value)} min={localTodayISO()}/></div><div><label htmlFor="booking-time" className="label">{tr(lang,'الوقت','Time')}</label><input id="booking-time" type="time" lang="en-GB" dir="ltr" className="field date-input" value={time} onChange={e=>setTime(e.target.value)}/></div>{date&&<p aria-live="polite" className="sm:col-span-2 text-sm rounded-xl bg-[#faf3f8] px-4 py-3 text-[#653855]"><CalendarDays className="inline-block me-2" size={17}/>{displayDate(date,lang)}{time?` — ${ar?'الساعة ':''}${displayTime(time,lang)}`:''}</p>}</>:<div className="sm:col-span-2 flex items-start gap-2 rounded-2xl bg-[#f9f3f8] px-4 py-3 text-sm"><CheckCircle2 size={18} className="text-[#8d517a] shrink-0 mt-1"/><span>{nearest||tr(lang,'لم يحدد المركز أقرب موعد حتى الآن؛ تواصل معنا للاستفسار عن التوفر.','No earliest time has been published yet; contact us to check availability.')}</span></div>}
 <div><label htmlFor="booking-name" className="label">{tr(lang,'الاسم الكريم *','Full name *')}</label><input id="booking-name" autoComplete="name" required className="field" placeholder={tr(lang,'اسمك الكامل','Your full name')} value={name} onChange={e=>setName(e.target.value)}/></div>
 <div><label htmlFor="booking-phone" className="label">{tr(lang,'رقم الجوال *','Mobile number *')}</label><input id="booking-phone" autoComplete="tel" type="tel" dir="ltr" required className="field" placeholder="05xxxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
 <div className="sm:col-span-2"><label htmlFor="booking-issue" className="label">{tr(lang,'تفاصيل الحالة (اختياري)','Brief concern (optional)')}</label><textarea id="booking-issue" rows={2} className="field resize-y" maxLength={450} placeholder={tr(lang,'يمكنك تركها فارغة ومناقشة الحالة مع المركز مباشرة','Leave blank to discuss your concerns directly with the clinic')} value={issue} onChange={e=>setIssue(e.target.value)}/></div>
 </div>
 <button type="button" className="button-primary w-full mt-6" onClick={send} disabled={!valid}><MessageCircle size={19}/>{tr(lang,'متابعة الحجز عبر واتساب','Continue to WhatsApp')}</button>
 <p className="small-note mt-3 flex items-start gap-2"><ShieldCheck size={16} className="shrink-0 mt-1"/>{tr(lang,'لا تُحفظ هذه البيانات في قاعدة بيانات الموقع؛ ستُضمّن في رسالة واتساب، لذا تجنب التفاصيل الصحية الحساسة. طلب الموعد لا يعني تأكيده.','The website does not store this form. The details are included in a WhatsApp message, so avoid sensitive medical information. This is not a confirmed booking.')}</p>
 </section>
}
