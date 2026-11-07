import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

const VALID_PERMISSIONS=['specialties','specialists','departments','availability','blog','achievements','settings','sections','media'];
export async function POST(request:Request){
  try{
    const origin=request.headers.get('origin');
    if(origin&&new URL(origin).host!==new URL(request.url).host)return NextResponse.json({error:'غير مصرح بهذا المصدر.'},{status:403});
    const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if(!token)return NextResponse.json({error:'يجب تسجيل الدخول أولاً.'},{status:401});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!anon||!serviceKey)return NextResponse.json({error:'لم تُضبط إعدادات الدعوات على الخادم. أضف SUPABASE_SERVICE_ROLE_KEY في Vercel فقط.'},{status:503});
    const viewer=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await viewer.auth.getUser(token);
    if(authError||!user)return NextResponse.json({error:'الجلسة غير صالحة.'},{status:401});
    const {data:profile,error:profileError}=await viewer.from('profiles').select('role,is_active').eq('id',user.id).single();
    if(profileError||profile?.role!=='super_admin'||!profile.is_active)return NextResponse.json({error:'هذه العملية للمدير الرئيسي فقط.'},{status:403});
    const body=await request.json() as {email?:string;permissions?:Record<string,unknown>};
    const email=String(body.email||'').trim().toLowerCase();
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:'البريد الإلكتروني غير صالح.'},{status:400});
    const permissions=Object.fromEntries(VALID_PERMISSIONS.map(k=>[k,body.permissions?.[k]===true]));
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const siteUrl=process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo=siteUrl&&/^https:\/\//.test(siteUrl)?new URL('/admin/login',siteUrl).toString():undefined;
    const {data:invitation,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,redirectTo?{redirectTo}:undefined);
    if(inviteError||!invitation.user?.id)return NextResponse.json({error:inviteError?.message||'تعذرت دعوة المدير.'},{status:400});
    const {error:saveError}=await admin.from('profiles').upsert({id:invitation.user.id,role:'admin',full_name:'',permissions,is_active:true},{onConflict:'id'});
    if(saveError)return NextResponse.json({error:'أُنشئت الدعوة ولكن تعذر إعداد صلاحيات المدير. راجع قاعدة البيانات: '+saveError.message},{status:500});
    await admin.from('activity_logs').insert({actor_id:user.id,action:'invite_admin',entity_type:'profiles',entity_id:invitation.user.id,details:{email}});
    return NextResponse.json({ok:true,message:'تم إرسال الدعوة إلى البريد الإلكتروني.'});
  }catch{return NextResponse.json({error:'حدث خطأ غير متوقع أثناء إنشاء الدعوة.'},{status:500})}
}
