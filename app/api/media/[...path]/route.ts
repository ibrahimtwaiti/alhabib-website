import {NextResponse} from 'next/server';import {get} from '@vercel/blob';
import {isV3Preview} from '@/lib/cms-store';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{path:string[]}>}){try{const {path}=await params;const id=path.join('/');if(!/^(?:v3-preview\/)?media\/[0-9a-f-]{36}\.(png|jpg|webp|avif)$/.test(id))return new NextResponse('Not found',{status:404});let result;
 if(isV3Preview()&&process.env.V3_PREVIEW_BLOB_READ_WRITE_TOKEN&&process.env.V3_PREVIEW_BLOB_READ_WRITE_TOKEN!==process.env.BLOB_READ_WRITE_TOKEN){try{result=await get(id,{access:'private',token:process.env.V3_PREVIEW_BLOB_READ_WRITE_TOKEN})}catch{}}
 // Pre-existing published portraits may still be stored in the clinic's original Blob store.
 if(!result||result.statusCode!==200)result=await get(id,{access:'private'});
 if(!result||result.statusCode!==200)return new NextResponse('Not found',{status:404});return new NextResponse(result.stream,{headers:{'Content-Type':result.blob.contentType||'image/jpeg','Cache-Control':'public,max-age=3600','X-Content-Type-Options':'nosniff'}})}catch{return new NextResponse('Not found',{status:404})}}
