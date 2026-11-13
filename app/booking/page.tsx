import PublicSite from '@/components/public-site';
import {pageMetadata} from '@/lib/page-metadata';
export const metadata=pageMetadata('طلب موعد عبر واتساب','اختر القسم والتخصص والأخصائي المناسب ثم أرسل طلب موعد إلى مركز الحبيب عبر واتساب. الموعد يؤكد من المركز.','/booking');
export default function Page(){return <PublicSite page="booking"/>}
