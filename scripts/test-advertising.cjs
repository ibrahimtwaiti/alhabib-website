/* Executes real validation, mutation handlers, and React server rendering.
 * Isolated in-memory persistence: no production accounts, data, or uploads. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const cache={};
let store={users:[],tables:{},updated_at:''},allowed=true,origin=true;
class CmsStorageError extends Error{constructor(code,message){super(message);this.code=code}}
const mocks={
 'next/server':{NextResponse:{json:(body,options={})=>({status:options.status||200,json:async()=>body})}},
 '@/lib/admin-auth':{currentUser:async()=>allowed?{id:'owner',username:'owner'}:null,hasAccess:u=>!!u,validateOrigin:async()=>origin},
 '@/lib/cms-store':{readCms:async()=>({store}),mutateCms:async fn=>{const next=structuredClone(store);const result=await fn(next);store=next;return result},newRow:r=>r,CmsStorageError}
};
function load(file){
 if(cache[file])return cache[file].exports;
 const mod={exports:{}};cache[file]=mod;
 const source=fs.readFileSync(file,'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(js,{module:mod,exports:mod.exports,require:name=>{
  if(mocks[name])return mocks[name];
  if(name.endsWith('.module.css'))return new Proxy({},{get:(_,key)=>String(key)});
  if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
  if(name==='./image-urls')return load('lib/image-urls.ts');
  return require(name);
 },URL,Date,JSON,console,process,setTimeout,clearTimeout,setInterval,clearInterval},{filename:file});
 return mod.exports;
}
const a=load('lib/advertising.ts'),route=load('app/api/admin/advertising/route.ts');
const {AdvertisingProvider,AdvertisingSlot}=load('components/advertising.tsx');
const now=Date.parse('2026-11-17T12:00:00Z');
const base={title:'عرض المركز',description:'وصف',alt:'إعلان اختباري',image_url:'/assets/alhabib-logo.webp',mobile_image_url:'',target_url:'/booking',is_active:true,sort_order:0,placement:'home_top',starts_at:null,ends_at:null};
const snap=()=>a.advertisingSnapshot(store);
const send=async payload=>{const r=await route.POST(new Request('https://example.test/api/admin/advertising',{method:'POST',body:JSON.stringify({revision:snap().revision,...payload})}));return {status:r.status,body:await r.json()}};
const render=data=>renderToStaticMarkup(React.createElement(AdvertisingProvider,{initial:data},React.createElement(AdvertisingSlot,{placement:'home_top'})));
(async()=>{
 assert.equal(render(a.publicAdvertising(store,now)),'','empty state must produce zero HTML');
 let response=await send({action:'save',ad:base});assert.equal(response.status,200);
 const first=response.body.ads[0].id;
 let publicData=a.publicAdvertising(store,now);
 assert.equal(publicData.ads.length,1);
 let html=render(publicData);assert.ok(html.includes('data-ad-placement'));assert.ok(!html.includes('الإعلان التالي'),'one ad has no navigation');
 assert.ok(!JSON.stringify(publicData).includes('owner'),'public data contains no administrator data');
 const oldRevision=snap().revision;
 response=await send({action:'save',ad:{...base,title:'second',sort_order:2}});assert.equal(response.status,200);
 const second=response.body.ads.find(x=>x.id!==first).id;
 html=render(a.publicAdvertising(store,now));assert.ok(html.includes('الإعلان التالي'),'multiple ads offer navigation');
 response=await send({action:'reorder',ids:[second,first]});assert.equal(response.status,200);assert.equal(snap().ads[0].id,second);
 response=await send({action:'reorder',ids:[first,first]});assert.equal(response.status,400);
 response=await send({action:'delete',id:first,revision:oldRevision});assert.equal(response.status,409);assert.equal(snap().ads.length,2);
 response=await send({action:'save',id:first,ad:{...base,is_active:false}});assert.equal(response.status,200);assert.equal(a.publicAdvertising(store,now).ads.length,1);
 response=await send({action:'save',id:second,ad:{...base,is_active:false}});assert.equal(response.status,200);
 assert.equal(render(a.publicAdvertising(store,now)),'','all disabled leaves no wrapper or spacing');
 response=await send({action:'save',id:first,ad:{...base,ends_at:new Date(now).toISOString()}});assert.equal(response.status,200);
 assert.equal(render(a.publicAdvertising(store,now)),'','end boundary is exclusive');
 response=await send({action:'save',id:first,ad:{...base,starts_at:new Date(now+1000).toISOString(),ends_at:new Date(now+2000).toISOString()}});assert.equal(response.status,200);
 assert.equal(a.publicAdvertising(store,now).ads.length,0);assert.equal(a.publicAdvertising(store,now).next_change_at,now+1000);
 assert.equal(a.publicAdvertising(store,now+1000).ads.length,1);assert.equal(a.publicAdvertising(store,now+2000).ads.length,0);
 for(const bad of [{target_url:'javascript:alert(1)'},{target_url:'//evil.test'},{target_url:'/\\evil.test'},{image_url:'data:image/png;base64,abc'},{starts_at:'invalid'},{starts_at:new Date(now+2000).toISOString(),ends_at:new Date(now).toISOString()},{placement:'unknown'},{sort_order:-1},{alt:''}]){
  response=await send({action:'save',ad:{...base,...bad}});assert.equal(response.status,400,JSON.stringify(bad));
 }
 allowed=false;response=await send({action:'delete',id:first});assert.equal(response.status,403);assert.equal((await route.GET()).status,403);
 allowed=true;origin=false;response=await send({action:'delete',id:first});assert.equal(response.status,403);origin=true;
 response=await send({action:'settings',settings:{...a.DEFAULT_AD_SETTINGS,interval_ms:1}});assert.equal(response.status,400);
 response=await send({action:'settings',settings:{...a.DEFAULT_AD_SETTINGS,autoplay:false,transition:'none'}});assert.equal(response.status,200);assert.equal(snap().settings.autoplay,false);
 await send({action:'delete',id:first});await send({action:'delete',id:second});
 assert.equal(snap().ads.length,0);assert.equal(render(a.publicAdvertising(store,now)),'','deleting final ad removes whole section');
 response=await send({action:'save',ad:base});assert.equal(response.status,200);assert.ok(render(a.publicAdvertising(store,now)).includes('data-ad-placement'),'new ad after empty list appears');
 assert.equal(a.publicAdvertising(store,now).ads[0].id,snap().ads[0].id,'fresh server read retains saved ad');
 const publicClient=fs.readFileSync('components/public-site-client.tsx','utf8');
 for(const placement of a.PLACEMENTS)assert.ok(publicClient.includes('placement="'+placement+'"'));
 console.log('Advertising: CRUD, authorization, conflicts, ordering, scheduling, settings, and zero-DOM server rendering passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
