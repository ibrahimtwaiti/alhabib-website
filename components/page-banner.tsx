'use client';
import Link from 'next/link';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {tr,type Language} from '@/lib/clinic-data';

/** One accessible banner for booking, staff, article and service pages. */
export default function PageBanner({lang,title,titleEn,subtitle,subtitleEn}:{
 lang:Language;title:string;titleEn:string;subtitle?:string;subtitleEn?:string
}){
 return <div className="inner-banner"><div className="container">
  <Link href="/" className="kicker">
   {lang==='ar'?<ArrowLeft size={17}/>:<ArrowRight size={17}/>}
   {tr(lang,'العودة للرئيسية','Back to home')}
  </Link>
  <h1 className="section-title mt-4">{tr(lang,title,titleEn)}</h1>
  {subtitle&&<p className="section-text mt-2 max-w-3xl">{tr(lang,subtitle,subtitleEn||subtitle)}</p>}
 </div></div>;
}
