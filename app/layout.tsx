import type { Metadata } from 'next';
import './globals.css';
import {IBM_Plex_Sans_Arabic,Plus_Jakarta_Sans} from 'next/font/google';
const arabicFont=IBM_Plex_Sans_Arabic({
 subsets:['arabic'],weight:['400','500','600','700'],display:'swap',variable:'--font-arabic'
});
const latinFont=Plus_Jakarta_Sans({
 subsets:['latin'],display:'swap',variable:'--font-latin'
});
const siteOrigin=process.env.NEXT_PUBLIC_SITE_URL||'https://alhabib-website.vercel.app';
const preview=process.env.VERCEL_ENV==='preview';
export const metadata: Metadata = {
 metadataBase:new URL(siteOrigin),
 title: {default:'مركز الحبيب | العلاج الطبيعي والتأهيل الطبي',template:'%s | مركز الحبيب'},
 description:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي: فريق متخصص في العلاج الطبيعي والتأهيل العصبي والرياضي وصحة المرأة والتغذية والإرشاد النفسي. اطلب موعدك عبر واتساب.',
 applicationName:'مركز الحبيب',
 openGraph:{url:'/',type:'website',locale:'ar_SA',siteName:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي',title:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي',description:'رعاية تأهيلية متخصصة وفريق متعدد الخبرات في سيهات.',images:[{url:'/assets/alhabib-logo.webp',alt:'شعار مركز الحبيب'}]},
 twitter:{card:'summary',title:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي'},
 robots:preview?{index:false,follow:false,noarchive:true}:undefined,
 icons:{icon:'/assets/alhabib-logo.webp'}
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body className={arabicFont.variable+' '+latinFont.variable}>{children}</body></html>}
