import {pageMetadata} from '@/lib/page-metadata';
import PublicSite from '@/components/public-site';
export const metadata=pageMetadata('من نحن','تعرف على رسالة مركز الحبيب للعلاج الطبيعي والتأهيل الطبي وفريقنا ونهجنا في الرعاية.','/about');
export default function Page(){return <PublicSite page="about"/>}
