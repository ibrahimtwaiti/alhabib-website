import {NextRequest,NextResponse} from 'next/server';

/**
 * Two independent Vercel projects use the same source and CMS:
 * - Public deployment (default): administrative UI and API paths respond 404.
 * - Admin deployment (ADMIN_PORTAL_ENABLED=1): only the portal and its APIs
 *   are exposed. This must be set ONLY on the dedicated admin project.
 *
 * Hiding a navigation link alone is not access control. CMS endpoint
 * authentication and permissions still apply on the admin project.
 */
export function middleware(request:NextRequest){
 const pathname=request.nextUrl.pathname;
 const adminDeployment=process.env.ADMIN_PORTAL_ENABLED==='1';
 const adminPath=pathname==='/admin'||pathname.startsWith('/admin/');
 const adminApi=pathname==='/api/admin'||pathname.startsWith('/api/admin/');
 const isAdminResource=adminPath||adminApi;
 const notFound=()=>new NextResponse('Not Found',{
  status:404,
  headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}
 });

 // The public website must never serve a functional admin route, even if
 // someone types its old URL instead of following a visible navigation link.
 if(!adminDeployment&&isAdminResource)return notFound();

 if(adminDeployment){
  if(pathname==='/robots.txt')return new NextResponse('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
  if(pathname==='/sitemap.xml')return notFound();
  if(pathname==='/'||pathname==='/admin')return NextResponse.redirect(new URL('/admin/login',request.url),307);
  // CMS compatibility adapter uses /api/cms and other same-origin API
  // endpoints, so retain /api/* while hiding public-facing pages.
  if(!isAdminResource&&!pathname.startsWith('/api/'))return notFound();
 }

 const response=NextResponse.next();
 if(adminDeployment)response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
 return response;
}

export const config={
 matcher:['/((?!_next/|assets/|favicon.ico|.*\\.(?:png|jpe?g|webp|avif|svg|gif|ico|woff2?|css|js)$).*)']
};
