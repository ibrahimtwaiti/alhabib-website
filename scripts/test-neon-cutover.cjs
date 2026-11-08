/* Dedicated-production Neon shadow migration checks; no network or real credentials. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const env={VERCEL_ENV:'production',DATABASE_URL:'postgresql://legacy:secret@old.example.neon.tech/neondb',ALHABIB_NEXT_DATABASE_URL:'postgresql://new:secret@new.example.neon.tech/alhabib_cms'};
const source=fs.readFileSync('lib/cms-migration.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const writes=[],target={version:null,json:null};
let connections=0;
const neon=url=>{
 assert.ok(url.includes('new.example.neon.tech'),'migration must not connect to the source as target');
 connections++;
 return (strings,...args)=>{
  const sql=strings.join('?');
  if(sql.includes('CREATE TABLE IF NOT EXISTS'))return Promise.resolve([]);
  if(sql.includes('INSERT INTO alhabib_cms_state')){
   const version=Number(args[0]),json=args[1];
   if(target.version===null||target.version<version){target.version=version;target.json=json;}
   writes.push(version);return Promise.resolve([]);
  }
  if(sql.includes('SELECT version,payload='))return Promise.resolve(target.version===null?[]:[{version:target.version,matches:target.json===args[0]}]);
  throw Error('Unexpected SQL '+sql.slice(0,60));
 };
};
const m={exports:{}};
vm.runInNewContext(js,{module:m,exports:m.exports,require:name=>{
 if(name==='server-only')return {};
 if(name==='@neondatabase/serverless')return {neon};
 throw Error('Unexpected import '+name);
},process:{env},console:{info:()=>{},error:()=>{}},Date,URL,JSON,Promise},{filename:'cms-migration.ts'});
const {mirrorCmsToNeon,checkNeonMirror}=m.exports;
const store={users:[{id:'admin-1',username:'synthetic-admin'}],tables:{blog_posts:[{id:'fake-post-1',title_ar:'مقال اختبار'}]},updated_at:'test'};
(async()=>{
 await mirrorCmsToNeon(store,5);
 assert.equal(target.version,5,'initial migration stores the source version');
 assert.equal(JSON.parse(target.json).users.length,1,'accounts are copied, not initialized as blank');
 assert.equal(JSON.parse(target.json).tables.blog_posts.length,1,'editorial content is mirrored');
 assert.equal(await checkNeonMirror(store,5),true,'health check verifies version and complete payload');
 await mirrorCmsToNeon(store,4);
 assert.equal(target.version,5,'older reads cannot replace newer snapshots');
 assert.equal(writes.length,1,'previous version is not resubmitted');
 const next={...store,tables:{...store.tables,blog_posts:[...store.tables.blog_posts,{id:'fake-post-2'}]}};
 await mirrorCmsToNeon(next,6);
 assert.equal(target.version,6);
 assert.equal(await checkNeonMirror(next,6),true);
 assert.equal(await checkNeonMirror(store,5),false);
 await assert.rejects(()=>mirrorCmsToNeon({users:[],tables:{}},7),/no admin/);
 env.ALHABIB_PRIMARY_DATABASE_URL=env.ALHABIB_NEXT_DATABASE_URL;
 await mirrorCmsToNeon(next,10);
 assert.equal(target.version,6,'shadow migration stops after production cutover');
 assert.equal(connections,1,'dedicated Neon client reused');
 const storeSource=fs.readFileSync('lib/cms-store.ts','utf8');
 assert.ok(storeSource.includes('ALHABIB_CMS_READ_ONLY'));
 assert.ok(storeSource.includes('ALHABIB_PRIMARY_DATABASE_URL'));
 const postgres=fs.readFileSync('lib/cms-postgres.ts','utf8');
 assert.ok(postgres.includes('Dedicated production CMS has not been migrated'),'cutover must fail closed if target is blank');
 console.log('Dedicated Neon shadow copy, monotonic revisions, content/accounts, and cutover safeguards passed');
})().catch(e=>{console.error(e);process.exitCode=1});
