import {NextResponse} from 'next/server';
import {readCms,mutateCms,type CmsUser} from '@/lib/cms-store';
import {hashPassword,safeSame,setSession,validateOrigin} from '@/lib/admin-auth';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{const {store}=await readCms();return NextResponse.json({setupRequired:store.users.length===0},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({setupRequired:false,error:'storage-not-ready'},{status:503})}}
export async function POST(req:Request){try{
 if(!await validateOrigin(req))return NextResponse.json({error:'طلب غير موثوق'},{status:403});
 const {username,password,setupCode}=await req.json();
 if(typeof username!=='string'||!/^[a-zA-Z][a-zA-Z0-9_.-]{2,39}$/.test(username))return NextResponse.json({error:'اسم المستخدم يجب أن يبدأ بحرف إنجليزي ويتكون من 3 إلى 40 حرفاً'},{status:400});
 if(typeof password!=='string'||password.length<12||password.length>128)return NextResponse.json({error:'اختر كلمة مرور قوية من 12 حرفاً على الأقل'},{status:400});
 if(typeof setupCode!=='string'||!process.env.ADMIN_SETUP_CODE||!safeSame(setupCode,process.env.ADMIN_SETUP_CODE))return NextResponse.json({error:'رمز التفعيل غير صحيح'},{status:403});
 const user=await mutateCms((store)=>{if(store.users.length)throw Error('SETUP_COMPLETE');const account:CmsUser={id:randomUUID(),username:username.toLowerCase(),full_name:'المدير الرئيسي',password_hash:hashPassword(password),role:'super_admin',permissions:{},is_active:true,session_version:1,created_at:new Date().toISOString()};store.users.push(account);return account});
 await setSession(user);return NextResponse.json({ok:true});
 }catch(err){return NextResponse.json({error:String(err).includes('SETUP_COMPLETE')?'تم إنشاء المدير الرئيسي بالفعل':'تعذر تفعيل حساب الإدارة'},{status:409})}}
