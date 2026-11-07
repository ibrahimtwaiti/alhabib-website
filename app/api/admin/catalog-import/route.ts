import {NextResponse} from 'next/server';
import {currentUser,validateOrigin} from '@/lib/admin-auth';
import {mutateCms} from '@/lib/cms-store';
import {importClinicCatalog,type CatalogSection} from '@/lib/catalog-import';
export const runtime='nodejs';export const dynamic='force-dynamic';
const responseHeaders={'Cache-Control':'no-store'};

export async function POST(request:Request){
 if(!await validateOrigin(request))return NextResponse.json({error:'طلب غير موثوق'},{status:403,headers:responseHeaders});
 const user=await currentUser();
 if(!user||user.role!=='super_admin')return NextResponse.json({error:'هذه العملية متاحة للمدير الرئيسي فقط'},{status:403,headers:responseHeaders});
 let module:CatalogSection;
 try{const body=await request.json();if(body?.module!=='team'&&body?.module!=='specialties')throw new Error();module=body.module}
 catch{return NextResponse.json({error:'نوع الاستيراد غير صالح'},{status:400,headers:responseHeaders})}
 try{
  const result=await mutateCms(store=>importClinicCatalog(store,module));
  return NextResponse.json({ok:true,...result},{headers:responseHeaders});
 }catch(error){
  console.error('catalog-import failed:',error instanceof Error?error.name:'unknown');
  return NextResponse.json({error:'تعذر حفظ الاستيراد في التخزين الخاص. أعد المحاولة؛ لن تُحذف الملفات الموجودة. إذا تكرر الخطأ، تحقق من اتصال Vercel Blob وصلاحياته.'},{status:503,headers:responseHeaders});
 }
}
