import type {MetadataRoute} from 'next';
import {profiles,specialties} from '@/lib/clinic-data';
export default function sitemap():MetadataRoute.Sitemap{
 const origin=process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,'');
 if(!origin)return [];
 const paths=['','about','team','specialties','booking','contact','blog','achievements','privacy','terms',...profiles.map(p=>'team/'+p.slug),...specialties.map(s=>'specialties/'+s.slug)];
 return paths.map(path=>({url:origin+'/'+path,changeFrequency:'monthly' as const,priority:path?0.7:1}));
}
