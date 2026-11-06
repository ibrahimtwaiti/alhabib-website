import PublicSite from '@/components/public-site';
import {specialties} from '@/lib/clinic-data';
import type {Metadata} from 'next';
export function generateStaticParams(){return specialties.map(s=>({slug:s.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const s=specialties.find(x=>x.slug===slug);return {title:s?.nameAr||'التخصصات',description:s?.introAr}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <PublicSite page="specialty" slug={slug}/>}
