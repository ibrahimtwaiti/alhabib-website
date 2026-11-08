import PublicSite from '@/components/public-site';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'طلب موعد عبر واتساب',description:'اختر القسم والتخصص والأخصائي المناسب ثم أرسل طلب موعد إلى مركز الحبيب عبر واتساب. الموعد يؤكد من المركز.'};
export default function Page(){return <PublicSite page="booking"/>}
