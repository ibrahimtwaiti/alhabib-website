import PublicSite from '@/components/public-site';
import type {Metadata} from 'next';
export const metadata:Metadata={alternates:{canonical:'/'}};
export default function Home(){return <PublicSite page="home"/>}
