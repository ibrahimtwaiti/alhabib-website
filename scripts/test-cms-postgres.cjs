const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const src=fs.readFileSync('lib/cms-postgres.ts','utf8');
const compiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const legacy={users:[{id:'owner',username:'admin',password_hash:'salt:hash'}],tables:{specialists:[{id:'p',name_ar:'أخصائي'}],specialties:[],site_settings:[]},updated_at:new Date().toISOString()};
let state=null,version=0,legacyReads=0,updateCalls=0,injectConflict=true;
const sql=(parts,...values)=>{
 const q=parts.join('?').replace(/\s+/g,' ').toUpperCase();
 if(q.includes('CREATE TABLE'))return Promise.resolve([]);
 if(q.includes('SELECT VERSION,PAYLOAD'))return Promise.resolve(state?[{version,payload:JSON.parse(JSON.stringify(state))}]:[]);
 if(q.includes('INSERT INTO ALHABIB_CMS_STATE')){if(!state){state=JSON.parse(values[0]);version=0;}return Promise.resolve([])}
 if(q.includes('UPDATE ALHABIB_CMS_STATE')){
  updateCalls++;if(injectConflict){injectConflict=false;return Promise.resolve([])}
  if(values[1]!==version)return Promise.resolve([]);
  state=JSON.parse(values[0]);version++;return Promise.resolve([{version}]);
 }
 throw Error('Unexpected query '+q);
};
const m={exports:{}};
const env={...process.env,DATABASE_URL:'postgresql://fake:fake@localhost/test'};
vm.runInNewContext(compiled,{module:m,exports:m.exports,require:name=>name==='server-only'?{}:name==='@neondatabase/serverless'?{neon:()=>sql}:name==='./cms-store'?{cmsDatabaseUrl:()=>env.DATABASE_URL}:require(name),setTimeout,process:{env},console,Date,JSON}, {filename:'cms-postgres.ts'});
const {readPostgresCms,mutatePostgresCms}=m.exports;
const seed=async()=>{legacyReads++;return JSON.parse(JSON.stringify(legacy))};
(async()=>{
 const a=await readPostgresCms(seed);assert.equal(a.store.users[0].password_hash,'salt:hash');assert.equal(a.version,0);
 const changed=await mutatePostgresCms(store=>{store.tables.specialists[0].name_ar='معدل';return 'ok'},seed);assert.equal(changed,'ok');
 assert.equal(state.tables.specialists[0].name_ar,'معدل');assert.equal(state.users[0].password_hash,'salt:hash');assert.equal(updateCalls,2);
 const b=await readPostgresCms(seed);assert.equal(b.version,1);assert.equal(legacyReads,1);console.log('Postgres CMS migration, user preservation and CAS retry: 7 checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
