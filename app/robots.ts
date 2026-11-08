import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
 if(process.env.VERCEL_ENV==='preview')return {rules:{userAgent:'*',disallow:'/'}};
 return {rules:{userAgent:'*',allow:'/',disallow:['/admin/','/api/']},sitemap:(process.env.NEXT_PUBLIC_SITE_URL||'https://alhabib-website.vercel.app').replace(/\/$/,'')+'/sitemap.xml'};
}
