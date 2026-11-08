import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/admin-auth';
import {readCms,cmsUsesPostgres,canWriteCms,isV3Preview} from '@/lib/cms-store';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:'يرجى تسجيل الدخول'},{status:401});
 try{
  const {store}=await readCms();
  return NextResponse.json({backend:cmsUsesPostgres()?'postgres':'blob-legacy',ready:true,preview:isV3Preview(),writeProtected:!canWriteCms(),admins:store.users.length,specialists:store.tables.specialists?.length||0,specialties:store.tables.specialties?.length||0},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({backend:cmsUsesPostgres()?'postgres':'blob-legacy',ready:false,error:'تعذر التحقق من التخزين'},{status:503})}
}
