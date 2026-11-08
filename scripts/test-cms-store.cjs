const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');
process.env.BLOB_READ_WRITE_TOKEN='local-unit-test-token';
const source=fs.readFileSync('lib/cms-store.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let state=null,etag=null,calls=0,failOnce=false;
const blob={
 get:async(_path,options)=>{
  assert.equal(options.access,'private');
  assert.equal(options.useCache,false,'CMS must bypass stale CDN cache');
  return state?{statusCode:200,stream:new Blob([JSON.stringify(state)]).stream(),blob:{etag}}:null;
 },
 head:async()=>({etag}),
 put:async(_path,body,opts)=>{
   calls++;
   if(failOnce){failOnce=false;throw new Error('BlobPreconditionFailedError: 412')}
   if(state&&opts.ifMatch!==etag)throw new Error('BlobPreconditionFailedError: 412');
   if(state&&!opts.allowOverwrite)throw new Error('BlobAlreadyExistsError: 409');
   state=JSON.parse(body);etag='"rev-'+calls+'"';return {etag};
 }
};
const m={exports:{}};
const context={module:m,exports:m.exports,require:(name)=>name==='server-only'?{}:name==='@vercel/blob'?blob:name==='node:crypto'?crypto:require(name),Response,Blob,setTimeout,process,console};
vm.runInNewContext(js,context,{filename:'lib/cms-store.ts'});
const {mutateCms,readCms}=m.exports;
(async()=>{
 await mutateCms(s=>{s.users.push({id:'main-admin',username:'admin'});return 1});
 assert.equal(state.users.length,1);
 await mutateCms(s=>{s.tables.site_settings.push({key:'site_visuals',value:{hero:'https://example.com/hero.png'}});return 2});
 assert.equal(state.users.length,1);
 assert.equal(state.tables.site_settings[0].value.hero,'https://example.com/hero.png');
 failOnce=true;
 const before=calls;
 await mutateCms(s=>{s.tables.specialists.push({id:'p1',image_url:'https://images.example.com/p1.webp'});return 3});
 assert.equal(calls,before+2,'retry after optimistic concurrency conflict');
 const after=await readCms();
 assert.equal(after.store.users[0].username,'admin');
 assert.equal(after.store.tables.specialists[0].image_url,'https://images.example.com/p1.webp');
 assert.equal(after.store.tables.site_settings[0].value.hero,'https://example.com/hero.png');
 console.log('CMS immutable account preservation and optimistic-retry tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});
