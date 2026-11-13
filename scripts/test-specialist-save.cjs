const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const source=fs.readFileSync('app/api/admin/specialists/save/route.ts','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const A='a11ab1b0-2026-4000-8000-000000000001',B='a11ab1b0-2026-4000-8000-000000000002';
const S1='00000000-0000-4000-8000-000000000001',S2='00000000-0000-4000-8000-000000000002',S3='00000000-0000-4000-8000-000000000003';
let active=true,counter=0;
const store={users:[],tables:{
 specialists:[{id:A,name_ar:'الأخصائي الأول',is_published:true,photo_fit:'cover'}],
 specialties:[{id:S1,slug:'physical-therapy'},{id:S2,slug:'new-specialty'},{id:S3,slug:'sports-rehabilitation'}],
 specialist_specialties:[{id:'original-link',specialist_id:A,specialty_id:S1},{id:'unrelated',specialist_id:B,specialty_id:S3}],
 content_revisions:[],activity_logs:[]
}};
const routeExports={};
vm.runInNewContext(js,{exports:routeExports,console,Date,Set,JSON,Number,Object,Response,
 require:name=>{
  if(name==='next/server')return {NextResponse:{json:(data,options)=>Response.json(data,options)}};
  if(name==='@/lib/admin-auth')return {currentUser:async()=>active?{id:'owner',username:'manager',role:'super_admin'}:null,hasAccess:user=>!!user,validateOrigin:async req=>req.headers.get('origin')==='https://center.test'};
  if(name==='@/lib/cms-store')return {mutateCms:async fn=>fn(store),newRow:data=>({id:'row-'+(++counter),created_at:'now',updated_at:'now',...data}),CmsStorageError:class CmsStorageError extends Error{}};
  if(name==='@/lib/image-urls')return {isAllowedImageUrl:url=>url===''||url.startsWith('/assets/')||url.startsWith('https://')};
  throw Error('Unexpected import '+name);
 }});
const payload={
 name_ar:'الأخصائي الأول',name_en:'First Specialist',title_ar:'أخصائي',title_en:'Specialist',bio_ar:'نبذة',bio_en:'Biography',
 department:'men',qualifications:['شهادة'],conditions_ar:['علاج'],image_url:'/assets/portrait.webp',
 photo_fit:'cover',photo_position_x:50,photo_position_y:7,is_published:true
};
function request(body,options={}){
 const headers={'content-type':options.type||'application/json',...(options.origin===null?{}:{origin:options.origin||'https://center.test'}),...(options.site?{'sec-fetch-site':options.site}:{})};
 return new Request('https://center.test/api/admin/specialists/save',{method:'POST',headers,body:typeof body==='string'?body:JSON.stringify(body)});
}
(async()=>{
 let r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S1,S2,S3]}));
 assert.equal(r.status,200,'atomic multi-link request succeeds');
 assert.equal(store.tables.specialist_specialties.filter(x=>x.specialist_id===A).length,3);
 assert.ok(store.tables.specialist_specialties.find(x=>x.id==='original-link'),'unchanged association retains identifier');
 assert.equal(store.tables.specialists[0].image_url,'/assets/portrait.webp');
 assert.equal(store.tables.content_revisions.length,1,'old specialist preserved in revision history');
 r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S2,S3]}));
 assert.equal(r.status,200);
 assert.equal(store.tables.specialist_specialties.some(x=>x.specialist_id===A&&x.specialty_id===S1),false,'unchecked link removed');
 assert.equal(store.tables.specialist_specialties.some(x=>x.specialist_id===B&&x.specialty_id===S3),true,'unrelated links preserved');
 r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S2,S3]}));
 assert.equal(r.status,200);
 assert.equal(store.tables.specialist_specialties.filter(x=>x.specialist_id===A).length,2,'repeat save is idempotent');
 const previous=JSON.stringify(store.tables);
 for(const ids of [[],['99999999-1111-4111-8111-999999999999']]){
  r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:ids}));
  assert.ok([400,409].includes(r.status));
  assert.equal(JSON.stringify(store.tables),previous,'invalid selection makes no changes');
 }
 r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S2]},{origin:'https://attacker.test'}));
 assert.equal(r.status,403);
 r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S2]},{origin:null}));
 assert.equal(r.status,403);
 r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S2]},{site:'cross-site'}));
 assert.equal(r.status,403);
 active=false;
 r=await routeExports.POST(request({specialistId:A,payload,specialtyIds:[S2]}));
 assert.equal(r.status,403);
 active=true;
 r=await routeExports.POST(request({specialistId:B,payload,specialtyIds:[S2,S3]}));
 assert.equal(r.status,200,'new profile with multiple specialties created');
 assert.equal(store.tables.specialists.length,2);
 assert.equal(store.tables.specialist_specialties.filter(x=>x.specialist_id===B).length,2);
 console.log('Atomic specialist+specialties save, idempotence, authorization, rollback-on-validation and additions: passed');
})().catch(err=>{console.error(err);process.exitCode=1});
