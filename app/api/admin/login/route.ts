import {NextResponse} from 'next/server';
import {readCms,mutateCms} from '@/lib/cms-store';
import {setSession,verifyPassword,publicUser,validateOrigin} from '@/lib/admin-auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 if(!await validateOrigin(req))return NextResponse.json({error:'طلب غير موثوق'},{status:403});
 if(req.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase()!=='application/json')
  return NextResponse.json({error:'نوع الطلب غير صالح'},{status:415,headers:{'Cache-Control':'no-store'}});
 if(Number(req.headers.get('content-length')||0)>4096)
  return NextResponse.json({error:'حجم الطلب غير مسموح'},{status:413,headers:{'Cache-Control':'no-store'}});
 const raw=await req.text();
 if(raw.length>4096)return NextResponse.json({error:'حجم الطلب غير مسموح'},{status:413,headers:{'Cache-Control':'no-store'}});
 let body:unknown;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:'تنسيق الطلب غير صالح'},{status:400,headers:{'Cache-Control':'no-store'}})}
 if(!body||typeof body!=='object'||Array.isArray(body))
  return NextResponse.json({error:'تنسيق الطلب غير صالح'},{status:400,headers:{'Cache-Control':'no-store'}});
 const {username,password}=body as {username?:unknown;password?:unknown};
 if(typeof username!=='string'||typeof password!=='string'||username.length>80||password.length>300)���q�^