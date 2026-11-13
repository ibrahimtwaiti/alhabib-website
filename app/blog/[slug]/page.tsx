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
 const article=data.articles.find(x=>x.id===slug);
 if(!article)notFound();
 return pageMetadata(article.title_ar,article.excerpt_ar,'/blog/'+encodeURIComponent(slug),article.cover_image_url);
}
export default async function Page({params}:SlugParams){
 const {slug}=await params;
 return <PublicSite page="article" slug={slug}/>;
}
