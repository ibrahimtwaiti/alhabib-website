import {pageMetadata} from '@/lib/page-metadata';
import PublicSite from '@/components/public-site';
export const metadata=pageMetadata('الشروط والأحكام','تعرف على شروط استخدام موقع مركز الحبيب وطلب المواعيد عبر واتساب.','/terms');
export default function Page(){return <PublicSite page="terms"/>}
