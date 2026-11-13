/* V3 release guards: exercise preview isolation against simulated env; no network or secrets needed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../lib/cms-store.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const env={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'version-3',DATABASE_URL:'postgresql://prod:secret@prod.example.neon.tech/neondb'};
const moduleObject={exports:{}};
vm.runInNewContext(compiled,{
 module:moduleObject,exports:moduleObject.exports,
 require:name=>name==='server-only'?{}:name==='@vercel/blob'?{}:require(name),
 process:{env},console,Date,Buffer,URL,setTimeout
},{filename:'cms-store.ts'});
const {isV3Preview,cmsDatabaseUrl,canWriteCms,mutateCms}=moduleObject.exports;
(async()=>{
 assert.equal(isV3Preview(),true,'V3 branch recognized');
 assert.equal(canWriteCms(),false,'V3 preview cannot write without isolated Neon URL');
 env.VERCEL_GIT_COMMIT_REF='fix/v3-cms-hotfix';
 assert.equal(isV3Preview(),true,'all hotfix/PR previews must be isolated, regardless of branch name');
 assert.equal(canWriteCms(),false,'feature branch cannot write to production Neon');
 env.VERCEL_GIT_COMMIT_REF='version-3';
 assert.equal(cmsDatabaseUrl(),env.DATABASE_URL,'old preview can read production data');¶»§q«^