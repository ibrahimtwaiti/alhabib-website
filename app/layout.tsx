import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: {default:'مركز الحبيب | العلاج الطبيعي والتأهيل الطبي',template:'%s | مركز الحبيب'},
  description:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي: فريق متخصص في العلاج الطبيعي والتأهيل العصبي والرياضي وصحة المرأة والتغذية والإرشاد النفسي. اطلب موعدك عبر واتساب.',
  applicationName:'مركز الحبيب',openGraph:{type:'website',locale:'ar_SA',siteName:'مركز الحبيب للعلاج الطبيعي والتأهيل الطبي'},
  robots:{index:true,follow:true}, icons:{icon:'/assets/alhabib-logo.webp'}
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
