import type {Language} from './clinic-data';

export type BookingMessageData={
  lang:Language; name:string; phone:string; department:'men'|'women';
  specialty?:string; specialist?:string; concern?:string;
  timing:'soon'|'specific'; date?:string; time?:string;
};
/** Gregorian civil date from the date input, not a UTC timestamp. */
export function displayDate(iso:string,lang:Language='ar'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
  const d=new Date(Date.UTC(Number(iso.slice(0,4)),Number(iso.slice(5,7))-1,Number(iso.slice(8,10)),12));
  if(Number.isNaN(d.getTime())||d.getUTCFullYear()!==Number(iso.slice(0,4))||d.getUTCMonth()+1!==Number(iso.slice(5,7))||d.getUTCDate()!==Number(iso.slice(8,10)))return '';
  return new Intl.DateTimeFormat(lang==='ar'?'ar-SA-u-ca-gregory-nu-latn':'en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Riyadh'}).format(d);
}
export function displayTime(value:string,lang:Language='ar'){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return '';
  const [hour,minute]=value.split(':').map(Number);
  const hh=String(hour%12||12).padStart(2,'0');
  return lang==='ar'?`${hh}:${String(minute).padStart(2,'0')} ${hour<12?'صباحاً':'مساءً'}`:`${hh}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
}
export function localTodayISO(now=new Date()){
  // The clinic operates on Saudi local dates; avoid UTC midnight shifting the calendar date.
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=(type:string)=>parts.find(p=>p.type===type)?.value||'';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function buildWhatsAppMessage(data:BookingMessageData){
  const v=(x:string|undefined)=>x?.trim()||'';
  const when=data.timing==='specific'&&data.date&&data.time
    ?`${displayDate(data.date,data.lang)} — ${data.lang==='ar'?'الساعة ':''}${displayTime(data.time,data.lang)}`
    :data.lang==='ar'?'أقرب موعد متاح — حسب تأكيد المركز':'Earliest available — subject to clinic confirmation';
  if(data.lang==='en')return [
    '*New appointment request | Alhabib Physical Therapy & Medical Rehabilitation Center* 🏥📋',
    `• *Full name:* ${v(data.name)} 👤`,
    `• *Mobile number:* ${v(data.phone)} 📱`,
    `• *Department:* ${data.department==='women'?'Women':'Men'} 🩺`,
    `• *Requested specialty:* ${v(data.specialty)||'Not specified'} 🔎`,
    `• *Preferred specialist:* ${v(data.specialist)||'No preference'} 👩‍⚕️`,
    `• *Brief concern:* ${v(data.concern)||'I prefer to discuss my concern and assessment directly with the clinic'} 💬`,
    `• *Suggested appointment:* ${when} 🗓️🕒`,
    '',
    '> ⚠️ *Please note:* This is an initial appointment request, not a confirmed booking. Kindly contact me to verify availability and confirm the appointment. 📩✅'
  ].join('\n');
  return [
    '*طلب حجز موعد جديد | مركز الحبيب للعلاج الطبيعي والتأهيل الطبي* 🏥📋',
    `• *الاسم الكريم:* ${v(data.name)} 👤`,
    `• *رقم الجوال:* ${v(data.phone)} 📱`,
    `• *القسم:* ${data.department==='women'?'قسم النساء 👩':'قسم الرجال 👨'} 🩺`,
    `• *التخصص المطلوب:* ${v(data.specialty)||'غير محدد'} 🔍`,
    `• *الأخصائي/الأخصائية المفضلة:* ${v(data.specialist)||'بدون تفضيل'} 👩‍⚕️✨`,
    `• *تفاصيل الحالة:* ${v(data.concern)||'تفضيل مناقشة الحالة والتقييم مباشرة مع المركز'} 💬`,
    `• *الموعد المقترح:* ${when} 🗓️🕒`,
    '',
    '> ⚠️ *تنبيه:* هذا الإشعار يمثل طلباً مبدئياً ولا يُعد حجزاً نهائياً. يُرجى التواصل لتأكيد الموعد واعتماده رسمياً. 📩✅'
  ].join('\n');
}
