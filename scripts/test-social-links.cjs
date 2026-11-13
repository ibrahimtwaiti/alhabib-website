/* Synthetic regression tests for managed social profile links. No live site or DB writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(mod,filename)=>{
 const content=fs.readFileSync(filename,'utf8');
 mod._compile(ts.transpileModule(content,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
};
const {SOCIAL_PLATFORMS,DEFAULT_SOCIAL_LINKS,getSocialLinks,isValidSocialProfileUrl,socialHandle}=require('../lib/social-links.ts');
const {publicDataFromStore}=require('../lib/public-site-data.ts');
assert.equal(SOCIAL_PLATFORMS.length,4);
for(const platform of SOCIAL_PLATFORMS){
 assert.ok(isValidSocialProfileUrl(platform,DEFAULT_SOCIAL_LINKS[platform]),'default URL is valid: '+platform);
 assert.ok(socialHandle(platform,DEFAULT_SOCIAL_LINKS[platform]).startsWith('@'));
 assert.ok(isValidSocialProfileUrl(platform,''),'blank link safely hides platform');
 assert.ok(!isValidSocialProfileUrl(platform,'javascript:alert(1)'));
 assert.ok(!isValidSocialProfileUrl(platform,'http://example.com/unsafe'));
 assert.ok(!isValidSocialProfileUrl(platform,'https://instagram.com.evil.example/fake'));
}
assert.equal(socialHandle('x',DEFAULT_SOCIAL_LINKS.x),'@AlhabibPhy85165');
assert.equal(socialHandle('tiktok',DEFAULT_SOCIAL_LINKS.tiktok),'@alhabib_physio');
assert.ok(!isValidSocialProfileUrl('instagram','https://x.com/AlhabibPhy85165'));
assert.ok(!isValidSocialProfileUrl('x','https://x.com/intent/tweet'));
assert.ok(!isValidSocialProfileUrl('snapchat','https://www.snapchat.com/explore/alhabib_physio'));
assert.ok(!isValidSocialProfileUrl('tiktok','https://www.tiktok.com/login'));
assert.deepEqual(getSocialLinks(undefined),DEFAULT_SOCIAL_LINKS);
const settings={...DEFAULT_SOCIAL_LINKS,instagram:'https://www.instagram.com/updated_clinic/',snapchat:''};
const store={tables:{site_settings:[{id:'social1',key:'social_links',is_public:true,value:settings}],specialists:[],specialties:[],specialist_specialties:[],blog_posts:[],achievements:[],dynamic_sections:[]}};
const published=publicDataFromStore(store);
assert.equal(published.socialLinks.instagram,settings.instagram);
assert.equal(published.socialLinks.snapchat,'','empty Snapchat link must remain hidden');
assert.equal(published.socialLinks.tiktok,DEFAULT_SOCIAL_LINKS.tiktok);
assert.equal(JSON.stringify(published).includes('password_hash'),false);
store.tables.site_settings[0].value={...settings,instagram:'https://fake.example/profile'};
assert.equal(publicDataFromStore(store).socialLinks.instagram,'','invalid stored link should never be exposed');
store.tables.site_settings[0].is_public=false;
assert.equal(publicDataFromStore(store).socialLinks.instagram,DEFAULT_SOCIAL_LINKS.instagram,'unpublished settings use documented defaults');
const client=fs.readFileSync(path.join(__dirname,'../components/public-site-client.tsx'),'utf8');
assert.ok(client.includes('socialLinks={socialLinks}'),'SSR data is passed into footer');
assert.ok(client.includes('rel="noopener noreferrer"'),'external links open safely');
const admin=fs.readFileSync(path.join(__dirname,'../components/admin-social-links.tsx'),'utf8');
assert.ok(admin.includes("onConflict:'key'"),'social settings update same record');
assert.ok(admin.includes('is_public:true'),'links are published when saved');
console.log('Social links: official defaults, strict platform validation, CMS projection and admin integration passed');

const socialAdmin=fs.readFileSync(path.join(__dirname,'../components/admin-social-links.tsx'),'utf8');
assert.ok(socialAdmin.includes("key==='instagram'?'رابط حساب إنستغرام':nameAr"),'Instagram has a dedicated visible edit label');
assert.ok(socialAdmin.includes("value={values[key]} onChange={e=>change(key,e.target.value)}"),'Instagram input supports editing and saving');
const footerCss=fs.readFileSync(path.join(__dirname,'../app/globals.css'),'utf8');
assert.ok(footerCss.includes('.footer .footer-social-title{color:#ffffff}'),'dark footer social headline has explicit high-contrast white');
