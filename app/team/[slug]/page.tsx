import PublicSite from '@/components/public-site';
import {profiles} from '@/lib/clinic-data';
import type {Metadata} from 'next';
export function generateStaticParams(){return profiles.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=profiles.find(x=>x.slug===slug);return {title:p?.nameAr||'الفريق الطبي',description:p?.summaryAr}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <PublicSite page="profile" slug={slug}/>}
