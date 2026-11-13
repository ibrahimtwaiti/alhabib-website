import type {Metadata} from 'next';

/** Consistent canonical, Open Graph and social snippets for public routes. */
export function pageMetadata(title:string,description:string,path:string,image?:string|null):Metadata{
 const safeImage=image&&(/^(https:\/\/|\/[^/])/i.test(image))?image:'/assets/alhabib-logo.webp';
 return {
  title,description,
  alternates:{canonical:path},
  openGraph:{title,description,url:path,type:'website',locale:'ar_SA',
   images:[{url:safeImage,alt:title}]},
  twitter:{card:'summary',title,description}
 };
}
