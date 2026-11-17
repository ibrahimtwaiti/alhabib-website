import {NextResponse} from 'next/server';
import {loadPublishedSiteData} from '@/lib/public-site-server';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  return NextResponse.json((await loadPublishedSiteData()).advertising,{headers:{'Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({error:'Advertising temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
