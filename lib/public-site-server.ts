import {cache} from 'react';
import {publicDataFromStore} from '@/lib/public-site-data';
import {readCms,type CmsStore} from '@/lib/cms-store';

/** One authoritative CMS read per incoming request (metadata and page can share it).
 * Never cache published CMS data across requests or return private/admin records.
 */
export const loadPublishedSiteData=cache(async()=>{
 if(!process.env.DATABASE_URL&&!process.env.POSTGRES_URL&&!process.env.BLOB_READ_WRITE_TOKEN){
  const empty:CmsStore={users:[],tables:{},updated_at:''};
  return publicDataFromStore(empty);
 }
 const {store}=await readCms();
 return publicDataFromStore(store);
});
