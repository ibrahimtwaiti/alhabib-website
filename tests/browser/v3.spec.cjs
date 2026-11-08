const {test,expect}=require('@playwright/test');

test('V3 booking is minimal, validates input, and keeps WhatsApp-only workflow',async({page})=>{
 await page.addInitScript(()=>{window.open=(url)=>{window.__lastWhatsappUrl=String(url);return null}});
 await page.goto('/booking');
 await expect(page.locator('#booking-name')).toBeVisible();
 await expect(page.locator('#booking-phone')).toBeVisible();
 for(const id of ['booking-city','booking-email','booking-preview'])await expect(page.locator('#'+id)).toHaveCount(0);
 await expect(page.getByText('معاينة رسالة واتساب قبل المتابعة')).toHaveCount(0);
 await page.getByRole('button',{name:'متابعة الحجز عبر واتساب'}).click();
 await expect(page.getByText('اكتب اسمًا من حرفين على الأقل.')).toBeVisible();
 await page.locator('#booking-name').fill('مراجع تجريبي');
 await page.locator('#booking-phone').fill('0591234567');
 await page.getByRole('button',{name:'متابعة الحجز عبر واتساب'}).click();
 await expect.poll(()=>page.evaluate(()=>window.__lastWhatsappUrl||'')).toContain('https://wa.me/');
 const whatsapp=await page.evaluate(()=>window.__lastWhatsappUrl||'');
 expect(decodeURIComponent(whatsapp)).toContain('مراجع تجريبي');
 expect(decodeURIComponent(whatsapp)).not.toContain('*المدينة:*');
 expect(decodeURIComponent(whatsapp)).not.toContain('*البريد الإلكتروني:*');
});

test('specialist link preselects staff and department',async({page})=>{
 await page.goto('/booking?specialist=heba-alhabib');
 await expect(page.locator('#booking-dept')).toHaveValue('women');
 await expect(page.locator('#booking-specialist')).toHaveValue('heba-alhabib');
});

test('layout does not horizontally overflow on key devices',async({page})=>{
 for(const width of [360,390,768,1440]){
  await page.setViewportSize({width,height:860});
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  const metrics=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(metrics.doc, 'horizontal overflow at '+width+'px').toBeLessThanOrEqual(metrics.viewport+2);
 }
});

test('mobile menu and bilingual direction work',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const menu=page.getByRole('button',{name:'فتح القائمة'});
 await menu.click();
 await expect(page.locator('nav.nav-mobile')).toBeVisible();
 await page.getByRole('link',{name:'الفريق الطبي'}).last().click();
 await expect(page).toHaveURL(/\/team$/);
 await expect(page.locator('nav.nav-mobile')).toHaveCount(0);
 await page.getByRole('button',{name:'Switch to English'}).click();
 await expect(page.locator('html')).toHaveAttribute('dir','ltr');
 await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('scroll-reveal and photo styles preserve natural images',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 const hero=page.locator('.hero-photo img.hero-image');
 await expect(hero).toBeVisible();
 const image=await hero.evaluate(node=>({filter:getComputedStyle(node).filter,blend:getComputedStyle(node).mixBlendMode}));
 expect(image.filter).toBe('none');
 expect(image.blend).toBe('normal');
 const cards=page.locator('.section .specialty-card');
 await cards.first().scrollIntoViewIfNeeded();
 await expect(cards.first()).toHaveClass(/reveal-visible/);
});

test('prefers-reduced-motion disables automatic movement and keeps content accessible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 const hero=page.locator('.hero-photo');
 await expect(hero).toBeVisible();
 const animation=await hero.evaluate(node=>getComputedStyle(node).animationName);
 expect(animation).toBe('none');
 await expect(page.locator('.public-site .reveal-pending')).toHaveCount(0);
});
