const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const manifest={exports:{}};
vm.runInNewContext(compile('lib/approved-visual-media.ts'),{exports:manifest.exports,require:()=>{throw Error('no imports allowed')}});
const snapshot={exports:{}};
let id=0;
vm.runInNewContext(compile('lib/visual-baseline.ts'),{
 exports:snapshot.exports,Date,JSON,Number,Object,
 require:name=>{
  if(name==='server-only')return {};
  if(name==='./image-urls')return {isAllowedImageUrl:s=>/^https:\/\/|^\/api\/media\/|^\/assets\//.test(s)};
  if(name==='node:crypto')return {randomUUID:()=>String(++id).padStart(8,'0')+'-0000-4000-8000-000000000000'};
  if(name==='./approved-visual-media')return manifest.exports;
  throw Error(name);
 }
});
const {getVisualBaseline,captureVisualBaseline,restoreVisualBaseline,currentVisuals,VISUAL_BASELINE_KEY}=snapshot.exports;
const store={users:[{username:'kept'}],tables:{
 site_settings:[{key:'site_visuals',is_public:true,value:{hero:'/api/media/media/new-photo.webp',feature_team:'/assets/new-team.webp',heroFit:'contain'}}],
 specialists:[{id:'a11ab1b0-2026-4000-8000-000000000001',name_ar:'kept-name',image_url:'/api/media/media/latest-specialist.webp',photo_fit:'contain',photo_position_x:43,photo_position_y:21,qualifications:['kept']}],
 specialties:[{slug:'nutrition',name_ar:'nutrition',image_url:'/assets/new-nutrition.webp',icon:'leaf'}],
 activity_logs:[],content_revisions:[]
}};
const initial=getVisualBaseline({tables:{site_settings:[]}});
assert.equal(Object.keys(initial.specialists).length,10);
assert.ok(initial.visuals.hero.startsWith('/api/media/media/'));
assert.equal(currentVisuals(store).hero,'/api/media/media/new-photo.webp');
const current=captureVisualBaseline(store);
assert.equal(current.visuals.feature_team,'/assets/new-team.webp');
assert.equal(current.specialists['a11ab1b0-2026-4000-8000-000000000001'].photo_position_x,43);
assert.equal(current.specialties.nutrition.icon,'leaf');
assert.equal(store.tables.site_settings.filter(x=>x.key===VISUAL_BASELINE_KEY).length,1);
store.tables.site_settings.find(x=>x.key==='site_visuals').value={hero:'/assets/old-v1.webp'};
store.tables.specialists[0].image_url='/assets/old-v1.webp';
store.tables.specialists[0].name_ar='untouched-name';
store.tables.specialties[0].icon='brain';
restoreVisualBaseline(store);
assert.equal(currentVisuals(store).hero,'/api/media/media/new-photo.webp');
assert.equal(store.tables.specialists[0].image_url,'/api/media/media/latest-specialist.webp');
assert.equal(store.tables.specialists[0].photo_fit,'contain');
assert.equal(store.tables.specialists[0].name_ar,'untouched-name');
assert.deepEqual(store.tables.specialists[0].qualifications,['kept']);
assert.equal(store.tables.specialties[0].icon,'leaf');
assert.equal(store.users[0].username,'kept');
store.tables.site_settings.find(x=>x.key==='site_visuals').value={hero:'/assets/v4-approved.webp'};
captureVisualBaseline(store);
assert.equal(store.tables.site_settings.filter(x=>x.key===VISUAL_BASELINE_KEY).length,1,'only one active default');
assert.equal(getVisualBaseline(store).visuals.hero,'/assets/v4-approved.webp','new snapshot replaces former default');
assert.ok(!fs.readFileSync('lib/public-site-data.ts','utf8').includes('specialty_visuals'),'obsolete V1 fallback removed');
assert.ok(!fs.readFileSync('components/admin-visuals.tsx','utf8').includes("'/assets/team/heba-alhabib.webp'"),'admin no old preview fallback');
const routeSource=fs.readFileSync('app/api/admin/visual-baseline/route.ts','utf8');
assert.ok(routeSource.includes("!req.headers.get('origin')"),'mutating baseline API fails closed without Origin');
assert.ok(routeSource.includes("fetchSite!=='same-origin'"),'reject cross-site browser fetches');
console.log('Approved visual baseline: 20 assertions passed');
