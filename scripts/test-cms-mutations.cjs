/* Regression suite for CMS mutations: synthetic in-memory records only.
 * Executes the real Next.js route handler with isolated, mocked auth/storage.
 * Never connects to Vercel, Neon, Blob, or the production website.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

const socialSource=fs.readFileSync(path.join(__dirname,'../lib/social-links.ts'),'utf8');
const socialJs=ts.transpileModule(socialSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const socialModule={exports:{}};
vm.runInNewContext(socialJs,{module:socialModule,exports:socialModule.exports,URL,console},{filename:'lib/social-links.ts'});
const source=fs.readFileSync(path.join(__dirname,'../app/api/cms/route.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const tables=['specialists','specialties','specialist_specialties','blog_posts','achievements','site_settings','availability_settings','dynamic_sections','blog_categories','departments','activity_logs','content_revisions'];
const store={users:[],tables:Object.fromEntries(tables.map(t=>[t,[]])),updated_at:''};
let authenticated=true,serial=0;
const user={id:'synthetic-admin',username:'test-admin',role:'super_admin',permissions:{}};
const nextResponse={json:(body,options={})=>({status:options.status||200,body,json:async()=>body})};
const modules={
 'next/server':{NextResponse:nextResponse},
 '@/lib/admin-auth':{currentUser:async()=>authenticated?user:null,hasAccess:(who)=>!!who,publicUser:x=>x,validateOrigin:async()=>true},
 '@/lib/cms-store':{
   TABLES:tables,CmsStorageError:class CmsStorageError extends Error{},
   readCms:async()=>({store}),mutateCms:async fn=>fn(store),
   newRow:value=>({id:'synthetic-'+(++serial),created_at:'2026-11-09T00:00:00Z',updated_at:'2026-11-09T00:00:00Z',...value})
 },
 '@/lib/image-urls':{isAllowedImageUrl:()=>true},
 '@/lib/cms-dedupe':{latestById:rows=>rows},
 '@/lib/about-content':{ABOUT_CONTENT_KEY:'about_content',ABOUT_FIELDS:[]},
 '@/lib/social-links':socialModule.exports
};
const moduleObject={exports:{}};
vm.runInNewContext(compiled,{module:moduleObject,exports:moduleObject.exports,require:name=>{
 if(Object.prototype.hasOwnProperty.call(modules,name))return modules[name];
 throw Error('Unexpected module '+name);
},console,Date,JSON,Buffer,URL,Promise,setTimeout},{filename:'app/api/cms/route.ts'});
const {POST}=moduleObject.exports;
const request=body=>new Request('https://example.test/api/cms',{method:'POST',headers:{'content-type':'application/json'},body:typeof body==='string'?body:JSON.stringify(body)});
const send=async body=>{const response=await POST(request(body));return{status:response.status,...await response.json()}};

(async()=>{
 store.tables.blog_posts.push({id:'blog-1',title_ar:'مقال تجريبي',status:'draft'});
 let response=await send({table:'blog_posts',action:'delete',filters:[{key:'id',value:'blog-1'}]});
 assert.equal(response.status,200,'DELETE without payload must succeed');
 assert.equal(response.data.length,1,'deleted row should be returned');
 assert.equal(store.tables.blog_posts.length,0,'only the selected article should be deleted');
 assert.equal(store.tables.content_revisions.length,1,'article snapshot is archived for restore');
 assert.equal(store.tables.content_revisions[0].snapshot.id,'blog-1');
 assert.equal(store.tables.activity_logs.length,1,'deletion is recorded in the audit log');

 store.tables.dynamic_sections.push({id:'section-1',section_key:'synthetic'});
 response=await send({table:'dynamic_sections',action:'delete',filters:[{key:'id',value:'section-1'}]});
 assert.equal(response.status,200,'same fix covers custom sections');
 assert.equal(store.tables.dynamic_sections.length,0);

 store.tables.specialist_specialties.push({id:'link-1',specialist_id:'spec-1',specialty_id:'specialty-1'});
 response=await send({table:'specialist_specialties',action:'delete',filters:[{key:'specialist_id',value:'spec-1'}]});
 assert.equal(response.status,200,'same fix covers specialist-specialty links');
 assert.equal(store.tables.specialist_specialties.length,0);

 store.tables.blog_posts.push({id:'blog-2',title_ar:'مقال لا يجب حذفه',status:'draft'});
 response=await send({table:'blog_posts',action:'delete'});
 assert.equal(response.status,400,'unfiltered deletion must be rejected');
 assert.equal(store.tables.blog_posts.length,1);

 for(const filters of [[{key:'id',value:null}],[{key:'id;DROP',value:'blog-2'}],[{key:'id'}]]) {
   response=await send({table:'blog_posts',action:'delete',filters});
   assert.equal(response.status,400,'invalid filter must not reach CMS mutation');
   assert.equal(store.tables.blog_posts.length,1);
 }
 response=await send({table:'blog_posts',action:'delete',filters:{key:'id',value:'blog-2'}});
 assert.equal(response.status,400,'filter must be an array');
 response=await send({table:'blog_posts',action:'update',filters:[{key:'id',value:'blog-2'}]});
 assert.equal(response.status,400,'updates still require a valid payload');
 response=await send({table:'blog_posts',action:'insert',payload:null});
 assert.equal(response.status,400,'insert still rejects invalid data');
 response=await send({table:'blog_posts',action:'update',filters:[{key:'id',value:'blog-2'}],payload:[{title_ar:'a'},{title_ar:'b'}]});
 assert.equal(response.status,400,'update cannot silently discard extra payload rows');
 response=await send('{malformed JSON');
 assert.equal(response.status,400,'malformed JSON must be a client error');

 response=await send({table:'blog_posts',action:'update',filters:[{key:'id',value:'blog-2'}],payload:{title_ar:'عنوان مصحح'}});
 assert.equal(response.status,200,'normal updates still work');
 assert.equal(store.tables.blog_posts[0].title_ar,'عنوان مصحح');

 const socialLinks={...socialModule.exports.DEFAULT_SOCIAL_LINKS};
 response=await send({table:'site_settings',action:'upsert',onConflict:'key',payload:{key:'social_links',is_public:true,value:socialLinks}});
 assert.equal(response.status,200,'valid official social accounts should be saved in settings');
 assert.equal(store.tables.site_settings.length,1);
 assert.equal(store.tables.site_settings[0].value.instagram,socialLinks.instagram);
 response=await send({table:'site_settings',action:'upsert',onConflict:'key',payload:{key:'social_links',is_public:true,value:{...socialLinks,tiktok:'https://fake.example/steal'}}});
 assert.equal(response.status,400,'unsafe social profile URLs must be rejected by server validation');
 assert.equal(store.tables.site_settings[0].value.tiktok,socialLinks.tiktok,'invalid request must leave the approved settings unchanged');
 response=await send({table:'site_settings',action:'upsert',onConflict:'key',payload:{key:'social_links',is_public:true,value:{...socialLinks,x:'https://x.com/ClinicCare2026'}}});
 assert.equal(response.status,200,'admin can edit X account URL');
 assert.equal(store.tables.content_revisions.some(rev=>rev.source_key==='social_links'),true,'previous social links can be restored');

 authenticated=false;
 response=await send({table:'blog_posts',action:'delete',filters:[{key:'id',value:'blog-2'}]});
 assert.equal(response.status,403,'unauthenticated deletion remains forbidden');
 assert.equal(store.tables.blog_posts.length,1);
 console.log('CMS delete/update/insert validation, revision retention, audit, and auth regressions passed');
})().catch(error=>{console.error(error);process.exitCode=1});
