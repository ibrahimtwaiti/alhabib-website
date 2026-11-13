const {test,expect}=require('@playwright/test');

test('unknown or unpublished CMS detail URLs are real 404s, not successful placeholder pages',async({page})=>{
 for(const path of ['/team/nonexistent-specialist-phase2','/specialties/nonexistent-service-phase2','/blog/nonexistent-article-phase2']){
  const response=await page.goto(path);
  expect(response.status(),path).toBe(404);
  await expect(page.getByRole('heading',{name:'الصفحة غير موجودة'})).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content',/noindex/);
  await expect(page.getByRole('link',{name:'العودة إلى الرئيسية'})).toHaveAttribute('href','/');
 }
});

test('public pages expose canonical and unique SEO descriptions; admin is noindex',async({page})=>{
 for(const [path,title] of [['/','مركز الحبيب'],['/team','الفريق الطبي'],['/booking','طلب موعد'],['/specialties','التخصصات'],['/blog','المدونة']]){
  const response=await page.goto(path);
  expect(response.status(),path).toBe(200);
  await expect(page).toHaveTitle(new RegExp(title));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',/.{20,}/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp(path==='/'?'vercel\\.app/?$':'/'+path.slice(1)+'$'));
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content',/.+/);
 }
 await page.goto('/admin/login');
 await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content',/noindex/);
});

test('Arabic and English remain usable in booking with optimized local media',async({page})=>{
 await page.goto('/');
 const hero=page.locator('img.hero-image');
 await expect(hero).toBeVisible();
 await expect(hero).toHaveAttribute('fetchpriority','high');
 await expect(hero).toHaveAttribute('sizes',/(100vw|37vw)/);
 // No browser-level stylesheet request should be made to Google Fonts.
 const fontStyles=await page.locator('link[rel="stylesheet"][href*="fonts.googleapis.com"]').count();
 expect(fontStyles).toBe(0);
 await page.getByRole('button',{name:'Switch to English'}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await page.goto('/booking');
 await expect(page.getByRole('heading',{name:'Request an appointment',level:1})).toBeVisible();
 await expect(page.locator('#booking-name')).toBeVisible();
 await expect(page.locator('#booking-phone')).toBeVisible();
 await page.getByRole('button',{name:'التبديل إلى العربية'}).click().catch(async()=>{await page.getByRole('button',{name:'Switch to Arabic'}).click()});
 await expect(page.locator('html')).toHaveAttribute('lang','ar');
 await expect(page.getByRole('heading',{name:'طلب موعد',level:1})).toBeVisible();
});


test('published specialist and specialty detail pages remain navigable and crawlable',async({page})=>{
 for(const [path,heading] of [['/team/heba-alhabib','هبه'],['/specialties/physical-therapy','العلاج الطبيعي']]){
  const response=await page.goto(path);
  expect(response.status(),path).toBe(200);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp(path+'$'));
  await expect(page.locator('h1').first()).toContainText(heading);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',/.+/);
 }
});

test('robots and sitemap exclude internal admin endpoints',async({request})=>{
 const robots=await request.get('/robots.txt');
 expect(robots.status()).toBe(200);
 const rules=await robots.text();
 expect(rules).toContain('/admin/');
 expect(rules).toContain('/api/');
 const sitemap=await request.get('/sitemap.xml');
 expect(sitemap.status()).toBe(200);
 const xml=await sitemap.text();
 expect(xml).toContain('/team');
 expect(xml).not.toContain('/admin/');
});
