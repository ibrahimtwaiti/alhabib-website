/* V3 release guards: exercise preview isolation against simulated env; no network or secrets needed. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../lib/cms-store.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const env={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'version-3',DATABASE_URL:'postgresql://prod:secret@prod.example/neondb'};
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
 assert.equal(cmsDatabaseUrl(),env.DATABASE_URL,'old preview can read production data');
 await assert.rejects(()=>mutateCms(()=>{throw Error('Must not execute')}),/للقراءة فقط|V3_PREVIEW_DATABASE_URL/);
 env.V3_PREVIEW_DATABASE_URL=env.DATABASE_URL;
 assert.equal(canWriteCms(),false,'exact production DB must be rejected');
 env.V3_PREVIEW_DATABASE_URL='postgresql://other:password@prod.example/neondb';
 assert.equal(canWriteCms(),false,'different credentials with same host/database is not isolation');
 env.V3_PREVIEW_DATABASE_URL='postgresql://preview:password@isolated.example/neondb';
 assert.equal(canWriteCms(),true,'different database endpoint permits previews');
 assert.equal(cmsDatabaseUrl(),env.V3_PREVIEW_DATABASE_URL,'isolated Neon database selected');
 delete env.V3_PREVIEW_DATABASE_URL;
 env.VERCEL_GIT_COMMIT_REF='';
 env.V3_PREVIEW_MODE='1';
 assert.equal(isV3Preview(),true,'Vercel scoped marker protects preview even without branch ref');
 assert.equal(canWriteCms(),false);
 env.VERCEL_ENV='production';
 assert.equal(isV3Preview(),false);
 assert.equal(canWriteCms(),true,'production behavior remains unaffected');
 const upload=fs.readFileSync(path.join(__dirname,'../app/api/admin/upload/route.ts'),'utf8');
 assert.ok(upload.includes('if(!canWriteCms())'),'uploads must not change shared production Blob');
 assert.ok(upload.includes('V3_PREVIEW_BLOB_READ_WRITE_TOKEN'),'preview may use isolated Blob token');
 assert.ok(upload.includes("preview?'v3-preview/'"),'fallback uploads stay in V3-only append-only namespace');
 assert.ok(upload.includes('addRandomSuffix:false'),'API chooses protected UUID paths, no user supplied paths');
 assert.ok(fs.readFileSync(path.join(__dirname,'../app/api/media/[...path]/route.ts'),'utf8').includes('V3_PREVIEW_BLOB_READ_WRITE_TOKEN'),'preview media reads support the isolated store');
 const postgres=fs.readFileSync(path.join(__dirname,'../lib/cms-postgres.ts'),'utf8');
 assert.ok(postgres.includes('if(!readOnlyPreview)await ensureSchema(sql)'),'shared preview cannot CREATE TABLE');
 const api=fs.readFileSync(path.join(__dirname,'../app/api/cms/route.ts'),'utf8');
 assert.ok(api.includes("visuals.heroFit!=='cover'")&&api.includes("heroPositionX"),'CMS validates hero framing');
 assert.ok(api.includes("content_revisions")&&api.includes("actor_username"),'CMS stores revisions and audit');
 console.log('V3 Neon isolation, scoped uploads, CMS revision and image validation checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
