import {pageMetadata} from '@/lib/page-metadata';
import PublicSite from '@/components/public-site';
export const metadata=pageMetadata('الفريق الطبي','تعرّف على أخصائيي مركز الحبيب للعلاج الطبيعي والتأهيل الطبي وخبراتهم وتخصصاتهم.','/team');
export default function Page(){return <PublicSite page="team"/>}
