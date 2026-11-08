import {NextResponse} from 'next/server';
import {readCms,mutateCms} from '@/lib/cms-store';
import {setSession,verifyPassword,publicUser,validateOrigin} from '@/lib/admin-auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 if(!await validateOrigin(req))return NextResponse.json({error:'طلب غير موثوق'},{status:403});
 const {username,password}=await req.json();
 if(typeof username!=='string'||typeof password!=='string'||username.length>80||password.length>300)return NextResponse.json({error:'بيانات الدخول غير صحيحة'},{status:400});
 const {store}=await readCms();const user=store.users.find(u=>u.username.toLowerCase()===username.trim().toLowerCase());
 // Always use the expensive password hash path to prevent simple user enumeration.
 const locked=!!user?.locked_until&&user.locked_until>Date.now();
 const matched=verifyPassword(password,user?.password_hash||'00000000000000000000000000000000:'+ '00'.repeat(64));
 if(!user||!matched||!user.is_active||locked){
  if(user&&!locked){await mutateCms(s=>{const target=s.users.find(x=>x.id===user.id);if(!target)return;target.failed_attempts=(target.failed_attempts||0)+1;if(target.failed_attempts>=5){target.locked_until=Date.now()+15*60*1000;target.failed_attempts=0}})}
  return NextResponse.json({error:locked?'تم إيقاف المحاولات مؤقتاً لمدة 15 دقيقة':'اسم المستخدم أو كلمة المرور غير صحيحة'},{status:401,headers:{'Cache-Control':'no-store'}});
 }
 if(user.failed_attempts||user.locked_until){await mutateCms(s=>{const target=s.users.find(x=>x.id===user.id);if(target){target.failed_attempts=0;target.locked_until=0}})}
 await setSession(user);return NextResponse.json({user:publicUser(user)},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'تعذر تسجيل الدخول. تحقق من إعدادات التخزين والخادم.'},{status:503})}}
