import {NextRequest,NextResponse} from 'next/server';

/**
 * The public site and the admin portal share ONE Vercel project and CMS, but
 * have different hostnames. Only the dedicated admin hostname may serve
 * /admin and /api/admin. A hidden link alone would not protect these routes.
 */
const ADMIN_PORTAL_HOST='alhabib-center-admin.vercel.app';

export function middleware(request:NextRequest){
 const pathname=request.nextUrl.pathname;
 const hostname=(request.headers.get('host')||request.nextUrl.hostname).toLowerCase().replace(/:\d+$/,'').replace(/\.$/,'');
 const e2ePortal=process.env.ALHABIB_E2E==='1'&&request.headers.get('x-alhabib-test-admin')==='1';
 const adminPortal=hostname===ADMIN_PORTAL_HOST||e2ePortal||
  (process.env.NODE_ENV==='development'&&process.env.ADMIN_PORTAL_ENABLED==='1');
 const adminPath=pathname==='/admin'||pathname.startsWith('/admin/');
 const adminApi=pathname==='/api/admin'||pathname.startsWith('/api/admin/');
 const cmsApi=pathname==='/api/cms'||pathname.startsWith('/api/cms/');
 const isAdminResource=adminPath||adminApi||cmsApi;
 const notFound=()=>new NextResponse('Not Found',{
  status:404,
  headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}
 });

 // Old links such as https://alhabib-website.vercel.app/admin/login
 // must not expose either the login form or authenticated admin APIs.
 if(!adminPortal&&isAdminResource)return notFound();

 if(adminPortal){
  if(pathname==='/robots.txt')return new NextResponse('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
  if(pathname==='/sitemap.xml')return notFound();
  if(pathname==='/'||pathname==='/admin')return NextResponse.redirect(new URL('/admin/login',request.url),307);
  // The administrative CMS client calls same-origin /api/cms endpoints.
  // Permit /api/*; their existing authentication still controls mutations.
  if(!isAdminResource&&!pathname.startsWith('/api/'))return notFound();
 }

 const response=NextResponse.next();
 if(adminPortal)response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
 return response;
}

export const config={
 matcher:['/((?!_next/|assets/|favicon.ico|.*\\.(?:png|jpe?g|webp|avif|svg|gif|ico|woff2?|css|js)$).*)']
};
