export type BookingDetails={lang:'ar'|'en';name:string;phone:string;department:'men'|'women';specialty:string;specialist:string;issue:string;date:string;time:string;soon:boolean};
export function formatAppointmentDate(date:string,time:string,lang:'ar'|'en'='ar'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))return '';
 const [year,month,day]=date.split('-').map(Number);const [hour,minute]=time.split(':').map(Number);
 const dt=new Date(year,month-1,day,hour,minute);if(dt.getFullYear()!==year||dt.getMonth()!==month-1||dt.getDate()!==day||hour>23||minute>59)return '';
 const datePart=new Intl.DateTimeFormat(lang==='ar'?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{day:'numeric',month:'long',year:'numeric'}).format(dt);
 const timePart=new Intl.DateTimeFormat(lang==='ar'?'ar-SA-u-nu-latn':'en-US',{hour:'2-digit',minute:'2-digit',hour12:true}).format(dt);
 return lang==='ar'?`${datePart} — الساعة ${timePart}`:`${datePart} — ${timePart}`;
}
export function buildBookingMessage(b:BookingDetails){
 const a=b.lang==='ar';const schedule=b.soon?(a?'أقرب موعد متاح (بانتظار إفادة المركز)':'Earliest available (pending clinic confirmation)'):formatAppointmentDate(b.date,b.time,b.lang);
 const issue=b.issue.trim()|| (a?'تفضيل مناقشة الحالة والتقييم مباشرة مع المركز':'Prefer to discuss the concern directly with the clinic');
 if(a)return [
 '🏥📋 *طلب حجز موعد جديد | مركز الحبيب للعلاج الطبيعي والتأهيل الطبي*','',
 `👤 *الاسم الكريم:* ${b.name.trim()}`,
 `📱 *رقم الجوال:* ${b.phone.trim()}`,
 `🏥 *القسم:* ${b.department==='women'?'قسم النساء':'قسم الرجال'}`,
 `🔍 *التخصص المطلوب:* ${b.specialty||'غير محدد'}`,
 `👩‍⚕️ *الأخصائي/الأخصائية المفضلة:* ${b.specialist||'لا يوجد تفضيل'}`,
 `💬 *تفاصيل الحالة:* ${issue}`,
 `🗓️🕒 *الموعد المقترح:* ${schedule}`,'',
 '> ⚠️ *تنبيه:* هذا الإشعار يمثل طلباً مبدئياً ولا يُعد حجزاً نهائياً. يُرجى التواصل لتأكيد الموعد واعتماده رسمياً. 📩✅'
 ].join('\n');
 return ['🏥📋 *New appointment request | Alhabib Physical Therapy & Medical Rehabilitation*','',
 `👤 *Full name:* ${b.name.trim()}`,`📱 *Mobile:* ${b.phone.trim()}`,`🏥 *Department:* ${b.department==='women'?'Women':'Men'}`,
 `🔍 *Specialty:* ${b.specialty||'Not specified'}`,`👩‍⚕️ *Preferred specialist:* ${b.specialist||'No preference'}`,
 `💬 *Concern:* ${issue}`,`🗓️🕒 *Preferred appointment:* ${schedule}`,'',
 '> ⚠️ *Notice:* This is an initial appointment request, not a confirmed booking. Please contact the patient to confirm availability. 📩✅'].join('\n');
}
