const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const crypto=require('node:crypto');
const text=fs.readFileSync(require('node:path').join(__dirname,'../lib/admin-auth.ts'),'utf8');
const compiled=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const target={};
vm.runInNewContext(compiled,{exports:target,process,Buffer,URL,require:(name)=>name==='node:crypto'?crypto:name==='server-only'?{}:{}}, {timeout:5000});
const password='OneTime#AdminPassword2026';const hashed=target.hashPassword(password);
assert.notEqual(hashed,password);assert.equal(hashed.split(':').length,2);
assert.equal(target.verifyPassword(password,hashed),true);assert.equal(target.verifyPassword('incorrect',hashed),false);
assert.notEqual(target.hashPassword(password),hashed,'each password gets a unique salt');
assert.equal(target.safeSame('test','test'),true);assert.equal(target.safeSame('test','wrong'),false);
assert.equal(target.hasAccess({role:'super_admin'},'settings'),true);
assert.equal(target.hasAccess({role:'admin',permissions:{specialists:true}},'specialists'),true);
assert.equal(target.hasAccess({role:'admin',permissions:{specialists:true}},'users'),false);
(async()=>{
 const mk=(url,origin,site)=>({url,headers:{get:(key)=>key==='origin'?origin:key==='sec-fetch-site'?site:null}});
 assert.equal(await target.validateOrigin(mk('h¶»§q«^