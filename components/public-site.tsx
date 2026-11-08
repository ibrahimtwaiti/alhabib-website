import {connection} from 'next/server';
import PublicSiteClient from '@/components/public-site-client';
import {publicDataFromStore} from '@/lib/public-site-data';
import {readCms,type CmsStore} from '@/lib/cms-store';

type PageName='home'|'team'|'profile'|'specialties'|'specialty'|'about'|'contact'|'booking'|'privacy'|'terms'|'blog'|'article'|'achievements';

/** Render public media URLs from the authoritative CMS before HTML reaches the visitor.
 * No client-side replacement of bundled images after hydration.
 */
export default async function PublicSite({page='home',slug}:{page?:PageName,slug?:string}){
 await connection(); // Disable build-time HTML snapshots: fetch published content on every navigation/refresh.
 let store:CmsStore;
 if(!process.env.DATABASE_URL&&!process.env.POSTGRES_URL&&!process.env.BLOB_READ_WRITE_TOKEN){
  // CI smoke tests and unconfigured developer machines only, not deployed clinic environments.
  store={users:[],tables:{},updated_at:''};
 }else{
  store=(await readCms()).store;
 }
 const initialData=publicDataFromStore(store);
 return <PublicSiteClient page={page} slug={slug} initialData={initialData}/>;
}
