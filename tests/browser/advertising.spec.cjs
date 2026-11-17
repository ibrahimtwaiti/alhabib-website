const {test,expect}=require('@playwright/test');
const ad=(id,extra={})=>({id,title:'إعلان '+id,description:'تفاصيل العرض',alt:'صورة الإعلان '+id,image_url:'/assets/alhabib-logo.webp',mobile_image_url:'/assets/team/heba-alhabib.webp',target_url:'/booking',is_active:true,sort_order:0,placement:'home_top',starts_at:null,ends_at:null,created_at:'2026-11-17T00:00:00Z',updated_at:'2026-11-17T00:00:00Z',...extra});
const settings={autoplay:true,interval_ms:3000,transition_ms:100,transition:'fade',show_arrows:true,show_dots:true};
async function fixture(page,ads=[],config=settings){
 let items=ads,requests=0;
 await page.route('**/api/advertising',route=>{
  requests++;
  const now=Date.now(),future=items.flatMap(a=>[a.starts_at,a.ends_at].filter(Boolean).map(Date.parse)).filter(t=>t>now);
  return route.fulfill({json:{ads:items.filter(a=>a.is_active&&(!a.starts_at||Date.parse(a.starts_at)<=now)&&(!a.ends_at||Date.parse(a.ends_at)>now)),settings:config,server_now:now,next_change_at:future.length?Math.min(...future):null}});
 });
 await page.goto('/');
 return {set:ads=>{items=ads},refresh:async()=>{const before=requests;await expect.poll(async()=>{await page.evaluate(()=>window.dispatchEvent(new Event('focus')));return requests}).toBeGreaterThan(before)}};
}
test('empty, disable, delete last, expired and re-add remove the entire section without layout gaps',async({page})=>{
 const f=await fixture(page);
 const section=page.locator('[data-ad-placement]');
 await expect(section).toHaveCount(0);
 const original=await page.locator('.hero').evaluate(el=>el.getBoundingClientRect().top);
 f.set([ad('one')]);await f.refresh();await expect(section).toHaveCount(1);
 await expect(page.getByRole('button',{name:'الإعلان التالي'})).toHaveCount(0);
 for(const items of [[ad('one',{is_active:false})],[],[ad('one',{ends_at:new Date(Date.now()-1000).toISOString()})]]){
  f.set(items);await f.refresh();await expect(section).toHaveCount(0);
  expect(await page.locator('.hero').evaluate(el=>el.getBoundingClientRect().top)).toBe(original);
  f.set([ad('one')]);await f.refresh();await expect(section).toHaveCount(1);
 }
 await page.reload();await expect(section).toHaveCount(0);await f.refresh();await expect(section).toHaveCount(1);
});
test('scheduled final advertisement expires while page stays open',async({page})=>{
 const f=await fixture(page);
 f.set([ad('scheduled',{ends_at:new Date(Date.now()+2000).toISOString()})]);await f.refresh();
 await expect(page.locator('[data-ad-placement]')).toHaveCount(1);
 await expect(page.locator('[data-ad-placement]')).toHaveCount(0,{timeout:6000});
});
test('carousel supports automatic navigation, pause and manual controls',async({page})=>{
 const f=await fixture(page,[ad('one'),ad('two')]);await f.refresh();
 const section=page.locator('[data-ad-placement]');
 await expect(section).toHaveCount(1);
 await expect(section.getByRole('img')).toHaveAttribute('alt','صورة الإعلان one');
 await expect(section.getByRole('img')).toHaveAttribute('alt','صورة الإعلان two',{timeout:7000});
 await section.getByRole('button',{name:'عرض الإعلان 1',exact:true}).click();
 await expect(section.getByRole('img')).toHaveAttribute('alt','صورة الإعلان one');
 await page.waitForTimeout(3300);await expect(section.getByRole('img')).toHaveAttribute('alt','صورة الإعلان one');
 await section.getByRole('button',{name:'الإعلان التالي'}).click();await expect(section.getByRole('img')).toHaveAttribute('alt','صورة الإعلان two');
});
test('mobile image, no horizontal overflow, reduced motion and settings',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 const f=await fixture(page,[ad('one'),ad('two')]);await f.refresh();
 const section=page.locator('[data-ad-placement]');
 await expect(section.getByRole('img')).toBeVisible();
 await expect.poll(()=>section.getByRole('img').evaluate(el=>el.currentSrc)).toContain('heba-alhabib');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await section.getByRole('img').evaluate(el=>getComputedStyle(el).objectFit)).toBe('contain');
 await expect(section.locator('[data-transition]')).toHaveAttribute('data-transition','none');
 await page.waitForTimeout(3300);await expect(section.getByRole('img')).toHaveAttribute('alt','صورة الإعلان one');
});
