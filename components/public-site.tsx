import {connection} from 'next/server';
import PublicSiteClient from '@/components/public-site-client';
import {notFound} from 'next/navigation';
import {loadPublishedSiteData} from '@/lib/public-site-server';

type PageName='home'|'team'|'profile'|'specialties'|'specialty'|'about'|'contact'|'booking'|'privacy'|'terms'|'blog'|'article'|'achievements';

/** Render public media URLs from the authoritative CMS before HTML reaches the visitor.
 * No client-side replacement of bundled images after hydration.
 */
export default async function PublicSite({page='home',slug}:{page?:PageName,slug?:string}){
 await connection(); // Disable build-time HTML snapshots: fetch published content on every navigation/refresh.
 const initialData=await loadPublishedSiteData();
 // A missing or unpublished CMS item is a genuine 404, never a 200 placeholder.
 if(page==='profile'&&!initialData.people.some(p=>p.slug===slug))notFound();
 if(page==='specialty'&&!initialData.services.some(item=>item.slug===slug))notFound();
 if(page==='article'&&!initialData.articles.some(item=>item.id===slug))notFound();
 return <PublicSiteClient page={page} slug={slug} initialData={initialData}/>;
}
