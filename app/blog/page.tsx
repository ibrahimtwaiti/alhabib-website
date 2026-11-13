import {pageMetadata} from '@/lib/page-metadata';
import PublicSite from '@/components/public-site';
export const metadata=pageMetadata('المدونة الطبية','مقالات ومحتوى توعوي عن العلاج الطبيعي والتأهيل الطبي من فريق مركز الحبيب.','/blog');
export default function Page(){return <PublicSite page="blog"/>}
