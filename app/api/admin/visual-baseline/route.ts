import {NextResponse} from 'next/server';
import {currentUser,hasAccess,validateOrigin} from '@/lib/admin-auth';
import {readCms,mutateCms,newRow} from '@/lib/cms-store';
import {getVisualBaseline,captureVisualBaseline,restoreVisualBaseline} from '@/lib/visual-baseline';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
function fail(error:string,status:number){return NextResponse.json({error},{status,headers})}
export async function GET(){
 const user=await currentUser();
 if(!hasAccess(user,'settings'))return fail('لا تملك صلاحية إدارة النسخ الافتراضية',403);
 try{
  const {store}=await readCms();
  return NextResponse.json({baseline:getVisualBaseline(store)},{headers});
 }catch{return fail('تعذر تحميل النسخة الافتراضية',503)}
}
export async function POST(req:Request){
 const user=await currentUser();
 if(user?.role!=='super_admin')return fail('اعتماد واستعادة النسخة الافتراضية متاحان للمدير الرئيسي فقط',403);
 const fetchSite=req.headers.get('sec-fetch-site');
 if(!req.headers.get('origin')||(fetchSite&&fetchSite!=='same-origin')||!await validateOrigin(req))return fail('طلب غير موثوق',403);
 if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')return fail('نوع الطلب غير صالح',415);
 if(Number(req.headers.get('content-length')||0)>512)return fail('حجم الطلب غير صالح',413);
 let action:unknown;
 try{
  const raw=await req.text();if(raw.length>512)return fail('حجم الطلب غير صالح',413);
  action=(JSON.parse(raw) as {action?:unknown}).action;
 }catch{return fail('طلب غير صالح',400)}
 if(action!=='capture'&&action!=='restore')return fail('عملية غير معروفة',400);
 try{
  const baseline=await mutateCms(store=>{
   const result=action==='capture'?captureVisualBaseline(store):restoreVisualBaseline(store);
   const audit=store.tables.activity_logs ||= [];
   audit.unshift(newRow({actor_id:user.id,actor_username:user.username,
    operation:action==='capture'?'visual-baseline-approve':'visual-baseline-restore',
    table_name:'site_settings',affected_count:1}));
   if(audit.length>500)audit.length=500;
   return result;
  });
  return NextResponse.json({ok:true,baseline},{headers});
 }catch{return fail('تعذر حفظ النسخة. تحقق من اتصال Neon وصلاحيات التعديل.',503)}
}
