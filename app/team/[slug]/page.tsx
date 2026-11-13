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
 const p=data.people.find(x=>x.slug===slug);
 if(!p)notFound();
 return pageMetadata(p.nameAr,p.summaryAr,'/team/'+encodeURIComponent(slug),p.photo);
}
export default async function Page({params}:SlugParams){
 const {slug}=await params;
 return <PublicSite page="profile" slug={slug}/>;
}
