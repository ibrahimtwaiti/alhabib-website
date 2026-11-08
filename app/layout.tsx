import type { Metadata } from 'next';
import './globals.css';
const siteOrigin=process.env.NEXT_PUBLIC_SITE_URL||'https://alhabib-website.vercel.app';
const preview=process.env.VERCEL_ENV==='preview';
export const metadata: Metadata = {
 metadataBase:new URL(siteOrigin),
 title: {default:'مركز الحبيب | العلاج الطبيعي والتأهيل الطبي',template:'%s | مركز الحبيب'},
 description:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي: فريق متخصص في العلاج الطبيعي والتأهيل العصبي والرياضي وصحة المرأة والتغذية والإرشاد النفسي. اطلب موعدك عبر واتساب.',
 applicationName:'مركز الحبيب',
 openGraph:{type:'website',locale:'ar_SA',siteName:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي',title:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي',description:'رعاية تأهيلية متخصصة وفريق متعدد الخبرات في سيهات.',images:[{url:'/assets/alhabib-logo.webp',alt:'شعار مركز الحبيب'}]},
 twitter:{card:'summary',title:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي'},
 robots:{index:!preview,follow:!preview,noarchive:preview},
 icons:{icon:'/assets/alhabib-logo.webp'}
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
