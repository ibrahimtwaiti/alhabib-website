import type {MetadataRoute} from 'next';
import {profiles,specialties} from '@/lib/clinic-data';
import {readCms} from '@/lib/cms-store';
import {publicDataFromStore} from '@/lib/public-site-data';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(process.env.VERCEL_ENV==='preview')return [];
 const origin=(process.env.NEXT_PUBLIC_SITE_URL||'https://alhabib-website.vercel.app').replace(/\/$/,'');
 let teamPaths=profiles.map(p=>'team/'+p.slug);
 let servicePaths=specialties.map(s=>'specialties/'+s.slug);
 let articlePaths:string[]=[];
 if(process.env.DATABASE_URL||process.env.POSTGRES_URL||process.env.BLOB_READ_WRITE_TOKEN){
  try{
   const data=publicDataFromStore((await readCms()).store);
   teamPaths=data.people.map(p=>'team/'+p.slug);
   servicePaths=data.services.map(s=>'specialties/'+s.slug);
   articlePaths=data.articles.map(a=>'blog/'+encodeURIComponent(a.id));
  }catch{ /* Keep the sitemap available if the CMS is temporarily offline. */ }
 }
 const paths=['','about','team','specialties','booking','contact','blog','achievements','privacy','terms',...teamPaths,...servicePaths,...articlePaths];
 return [...new Set(paths)].map(path=>({url:origin+'/'+path,changeFrequency:'monthly' as const,priority:path?0.7:1}));
}
