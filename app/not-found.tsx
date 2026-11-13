import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={
 title:'الصفحة غير موجودة',
 description:'تعذر العثور على الصفحة المطلوبة في موقع مركز الحبيب.'
};
export default function NotFound(){
 return <main dir="rtl" className="min-h-[70vh] flex items-center justify-center bg-[#fcfafc] px-6 py-20 text-center">
  <section className="max-w-xl">
   <span className="text-[#8d517a] font-extrabold text-6xl" aria-hidden="true">404</span>
   <h1 className="text-[#46434a] font-extrabold text-3xl mt-5">الصفحة غير موجودة</h1>
   <p className="text-[#777078] leading-8 mt-4">قد يكون الرابط غير صحيح، أو تغيّر عنوان الصفحة، أو أُزيل المحتوى.</p>
   <p className="text-[#777078] mt-1" lang="en" dir="ltr">The requested page could not be found.</p>
   <div className="flex flex-wrap justify-center gap-3 mt-8">
    <Link href="/" className="button-primary">العودة إلى الرئيسية</Link>
    <Link href="/contact" className="button-outline">التواصل مع المركز</Link>
   </div>
  </section>
 </main>
}
