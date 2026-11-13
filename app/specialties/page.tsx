import {pageMetadata} from '@/lib/page-metadata';
import PublicSite from '@/components/public-site';
export const metadata=pageMetadata('التخصصات والخدمات','استكشف خدمات العلاج الطبيعي والتأهيل الطبي والتخصصات المتوفرة في مركز الحبيب.','/specialties');
export default function Page(){return <PublicSite page="specialties"/>}
