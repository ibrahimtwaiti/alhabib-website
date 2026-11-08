/* Exercise V3 image upload end-to-end at the API boundary, without calling Blob. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('app/api/admin/upload/route.ts','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const preview={value:true},write={value:true},signedIn={value:true};
const uploads=[];
class FakeFile{
 constructor(type='image/webp'){
  this.type=type;this.size=16;
 }
 async arrayBuffer(){return Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80,1,2,3,4]).buffer}
}
const m={exports:{}};
vm.runInNewContext(code,{module:m,exports:m.exports,File:FakeFile,Uint8Array,process:{env:{BLOB_READ_WRITE_TOKEN:'test-shared-blob-token'}},
 require:name=>{
  if(name==='next/server')return {NextResponse:{json:(body,config)=>({status:config?.status||200,body})}};
  if(name==='@vercel/blob')return {put:async(path,file,opt)=>{uploads.push({path,opt});return{pathname:path}}};
  if(name==='node:crypto')return {randomUUID:()=> '123e4567-e89b-12d3-a456-426614174000'};
  if(name==='@/lib/admin-auth')return {currentUser:async()=>signedIn.value?{role:'super_admin'}:null,hasAccess:(user)=>!!user,validateOrigin:async()=>true};
  if(name==='@/lib/cms-store')return {canWriteCms:()=>write.value,isV3Preview:()=>preview.value};
  throw Error('Unexpected mock dependency: '+name);
 }},{filename:'upload-route.ts'});
const req={formData:async()=>({get:key=>key==='file'?new FakeFile():null})};
(async()=>{
 const success=await m.exports.POST(req);
 assert.equal(success.status,200,'V3 upload succeeds with connected shared Blob token');
 assert.equal(success.body.path,'v3-preview/media/123e4567-e89b-12d3-a456-426614174000.webp');
 assert.equal(uploads.length,1);
 assert.equal(uploads[0].opt.access,'private');
 assert.equal(uploads[0].opt.addRandomSuffix,false);
 assert.equal(uploads[0].opt.token,undefined,'falls back to scoped shared store without a second credential');
 write.value=false;
 const forbidden=await m.exports.POST(req);
 assert.equal(forbidden.status,403,'database isolation guard still blocks unsafe writes');
 assert.equal(uploads.length,1);
 write.value=true;signedIn.value=false;
 const unauth=await m.exports.POST(req);
 assert.equal(unauth.status,403,'anonymous image uploads rejected');
 assert.equal(uploads.length,1);
 signedIn.value=true;preview.value=false;
 const production=await m.exports.POST(req);
 assert.equal(production.status,200);
 assert.equal(production.body.path,'media/123e4567-e89b-12d3-a456-426614174000.webp','normal production media path preserved');
 console.log('V3 authenticated preview upload, safe namespace, auth and isolation: passed');
})().catch(e=>{console.error(e);process.exitCode=1});
