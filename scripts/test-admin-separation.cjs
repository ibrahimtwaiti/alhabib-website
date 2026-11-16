const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=fs.readFileSync(path.join(root,'middleware.ts'),'utf8');
const publicClient=fs.readFileSync(path.join(root,'components/public-site-client.tsx'),'utf8');
assert.ok(!publicClient.includes('href="/admin/login"'),'Public website must not link to the admin login');
assert.match(file,/alhabib-center-admin\\.vercel\\.app/);
const src=ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function check(hostname,pathname){
 class ResponseStub{constructor(body,options={}){this.body=body;this.status=options.status||200;this.headers=new Map(Object.entries(options.headers||{}))}}
 class NextResponseStub extends ResponseStub{
  static next(){return new NextResponseStub(null,{status:200})}
  static redirect(url,status){const r=new NextResponseStub(null,{status});r.url=String(url);return r}
 }
 const exports={};
 vm.runInNewContext(src,{exports,process:{env:{NODE_ENV:'production'}},URL,require:(id)=>id==='next/server'?{NextResponse:NextResponseStub}:{}});
 return exports.middleware({nextUrl:{hostname,pathname},url:'https://'+hostname+pathname});
}
const publicHost='alhabib-website.vercel.app',adminHost='alhabib-center-admin.vercel.app';
for(const url of ['/admin','/admin/login','/admin/dashboard','/admin/setup','/api/admin/login','/api/admin/users']){
 assert.equal(check(publicHost,url).status,404,'Blocked on public: '+url);
}
for(const url of ['/','/booking','/about','/api/cms']){
 assert.equal(check(publicHost,url).status,200,'Public route stays available: '+url);
}
assert.equal(check(adminHost,'/').status,307);
assert.equal(check(adminHost,'/').url,'https://'+adminHost+'/admin/login');
for(const url of ['/admin/login','/admin/dashboard','/api/admin/login','/api/cms']){
 assert.equal(check(adminHost,url).status,200,'Admin site route works: '+url);
}
for(const url of ['/booking','/about','/specialties','/sitemap.xml']){
 assert.equal(check(adminHost,url).status,404,'Admin site hides visitor pages: '+url);
}
assert.match(check(adminHost,'/robots.txt').body,/Disallow: \\/\n/);
console.log('Admin portal segregation tests passed');
