import {NextResponse} from 'next/server';import {put} from '@vercel/blob';import {randomUUID} from 'node:crypto';
import {currentUser,hasAccess,validateOrigin} from '@/lib/admin-auth';
import {canWriteCms,isV3Preview} from '@/lib/cms-store';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!canWriteCms())return NextResponse.json({error:'معاينة V3 لا تسمح بالكتابة على قاعدة الإنتاج.'},{status:403});
 if(isV3Preview()&&(!process.env.V3_PREVIEW_BLOB_READ_WRITE_TOKEN||process.env.V3_PREVIEW_BLOB_READ_WRITE_TOKEN===process.env.BLOB_READ_WRITE_TOKEN))return NextResponse.json({error:'رفع الصور معطل في V3 حتى يتم تخصيص مخزن Vercel Blob منفصل لنسخة المعاينة.'},{status:403});
 const user=await currentUser();if(!hasAccess(user,'media')&&!hasAccess(user,'specialists')&&!hasAccess(user,'specialties')&&!hasAccess(user,'settings')&&!hasAccess(user,'blog')&&!hasAccess(user,'achievements')&&!hasAccess(user,'sections'))return NextResponse.json({error:'لا تملك صلاحية رفع الصور'},{status:403});
 if(!await validateOrigin(req))return NextResponse.json({error:'طلب غير موثوق'},{status:403});
 try{const f=await req.formData();const file=f.get('file');if(!(file instanceof File)||file.size>5*1024*1024||file.size<10)return NextResponse.json({error:'حجم الصورة غير صالح'},{status:400});
 const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};const ext=types[file.type];if(!ext)return NextResponse.json({error:'صيغة الصورة غير مدعومة'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());const ok=ext==='png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:ext==='jpg'?bytes[0]===255&&bytes[1]===216:ext==='webp'?String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP':String.fromCharCode(...bytes.slice(4,8))==='ftyp';if(!ok)return NextResponse.json({error:'الملف ليس صورة صالحة'},{status:400});
 const path=`media/${randomUUID()}.${ext}`;await put(path,file,{access:'private',contentType:file.type,addRandomSuffix:false,...(isV3Preview()?{token:process.env.V3_PREVIEW_BLOB_READ_WRITE_TOKEN}: {})});return NextResponse.json({path});
 }catch{return NextResponse.json({error:'تعذر حفظ الصورة في التخزين الدائم'},{status:503})}
}
