const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const file=fs.readFileSync(path.join(root,'middleware.ts'),'utf8');
const publicClient=fs.readFileSync(path.join(root,'components/public-site-client.tsx'),'utf8');
assert.ok(!publicClient.includes('href="/admin/login"'),'Public website must not link to the admin login');
assert.match(file,/ADMIN_PORTAL_ENABLED/);
const src=ts.transpileModule(file,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function check(portal,pathname){
 const state={env:{ADMIN_PORTAL_ENABLED:portal?'1':undefined}};
 class ResponseStub{constructor(body,options={}){this.body=body;this.status=options.status||200;this.headers=new Map(Object.entries(options.headers||{}))}}
 class NextResponseStub extends ResponseStub{
  static next(){return new NextResponseStub(null,{status:200})}
  static redirect(url,status){const r=new NextResponseStub(null,{status});r.url=String(url);return r}
 }
 const exports={};
 vm.runInNewContext(src,{exports,process:state,URL,NextResponse:NextResponseStub,require:(id)=>id==='next/server'?{NextResponse:NextResponseStub}:{}});
 return exports.middleware({nextUrl:{pathname},url:'https://portal.example.test'+pathname});
}
for(const url of ['/admin','/admin/login','/admin/dashboard','/admin/setup','/api/admin/login','/api/admin/users']){
 assert.equal(check(false,url).status,404,'Blocked on public: '+url);
}
for(const url of ['/','/booking','/about','/api/cms']){
 assert.equal(check(false,url).status,200,'Public route stays available: '+url);
}
assert.equal(check(true,'/').status,307);
assert.equal(check(true,'/').url,'https://portal.example.test/admin/login');
for(const url of ['/admin/login','/admin/dashboard','/api/admin/login','/api/cms']){
 assert.equal(check(true,url).status,200,'Admin site route works: '+url);
}
for(const url of ['/booking','/about','/specialties','/sitemap.xml']){
 assert.equal(check(true,url).status,404,'Admin site hides visitor pages: '+url);
}
assert.match(check(true,'/robots.txt').body,/Disallow: \/n?/);
console.log('Admin portal segregation tests passed');
