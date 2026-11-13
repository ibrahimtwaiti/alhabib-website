import PublicSite from '@/components/public-site';
import {loadPublishedSiteData} from '@/lib/public-site-server';
import {pageMetadata} from '@/lib/page-metadata';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';

export const dynamic='force-dynamic';
type SlugParams={params:Promise<{slug:string}>};

export async function generateMetadata({params}:SlugParams):Promise<Metadata>{
 const {slug}=await params;
 const data=await loadPublishedSiteData();
 const item=data.services.find(x=>x.slug===slug);
 if(!item)notFound();
 return pageMetadata(item.nameAr,item.introAr,'/specialties/'+encodeURIComponent(slug),item.image);
}
export default async function Page({params}:SlugParams){
 const {slug}=await params;
 return <PublicSite page="specialty" slug={slug}/>;
}
