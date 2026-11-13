'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const layout=read('app/layout.tsx');
const css=read('app/globals.css');
const client=read('components/public-site-client.tsx');
const server=read('components/public-site.tsx');
const loader=read('lib/public-site-server.ts');
const metadata=read('lib/page-metadata.ts');
assert.ok(layout.includes('next/font/google')&&layout.includes("display:'swap'"),'fonts should be self hosted and swap');
assert.ok(!css.includes('fonts.googleapis.com'),'fonts must not be render blocked by external CSS @import');
assert.ok(client.includes('fetchPriority="high"'),'hero must receive highest image request priority');
assert.ok(client.includes('unoptimizedPublicImage('),'local public CMS media must use Next optimizer');
assert.ok(client.includes('<PageBanner '),'detail page banners must share a reusable component');
assert.ok(!client.includes('function Banner('),'inline duplicated page banner removed');
assert.ok(loader.includes("cache(async()=>"),'metadata and page should share one request CMS projection');
assert.ok(server.includes("notFound()"),'missing CMS content must result in HTTP 404');
for(const route of ['about','achievements','blog','booking','contact','privacy','specialties','team','terms']){
 assert.ok(read('app/'+route+'/page.tsx').includes('pageMetadata('),'Missing route-specific metadata: '+route);
}
for(const route of ['blog','specialties','team']){
 const p=read('app/'+route+'/[slug]/page.tsx');
 assert.ok(p.includes("export const dynamic='force-dynamic'"),'dynamic metadata must track live CMS for '+route);
 assert.ok(p.includes('loadPublishedSiteData()')&&p.includes('notFound()'),'dynamic route must use authoritative published data for '+route);
}
assert.ok(read('app/admin/layout.tsx').includes('index:false'),'admin must not be indexed');
assert.ok(read('app/not-found.tsx').includes('الصفحة غير موجودة'),'custom 404 must be accessible');
assert.ok(metadata.includes('canonical:path'),'public routes require canonical URLs');
console.log('Phase 2 structural regression checks passed: fonts, image hints, shared banners, metadata, dynamic 404, admin noindex.');
