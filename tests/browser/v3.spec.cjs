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
  const metrics=await page.evaluate(()=>{
   const doc=document.documentElement.scrollWidth,viewport=window.innerWidth;
   const culprits=[...document.querySelectorAll('body *')].map(n=>{
    const box=n.getBoundingClientRect();return {tag:n.tagName,cls:String(n.className||'').slice(0,90),right:Math.round(box.right),left:Math.round(box.left)};
   }).filter(x=>x.right>viewport+2||x.left< -2).slice(0,12);
   return {doc,viewport,culprits};
  });
  expect(metrics.doc,'horizontal overflow at '+width+'px '+JSON.stringify(metrics.culprits)).toBeLessThanOrEqual(metrics.viewport+2);
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

test('homepage footer shows approved social profiles accessibly in both languages',async({page})=>{
 await page.goto('/');
 const footer=page.locator('footer');
 const expected=[
  ['instagram','https://www.instagram.com/alhabib_physio/'],
  ['x','https://x.com/AlhabibPhy85165'],
  ['snapchat','https://www.snapchat.com/add/alhabib_physio'],
  ['tiktok','https://www.tiktok.com/@alhabib_physio']
 ];
 const socialTitle=footer.getByRole('heading',{name:'تابع مركز الحبيب'});
 await expect(socialTitle).toBeVisible();
 expect(await socialTitle.evaluate(el=>getComputedStyle(el).color),'social heading must contrast against the dark footer').toBe('rgb(255, 255, 255)');
 for(const [platform,href] of expected){
  const link=footer.locator('a[href="'+href+'"]');
  await expect(link,platform).toHaveCount(1);
  await expect(link).toHaveAttribute('target','_blank');
  await expect(link).toHaveAttribute('rel',/noopener noreferrer/);
 }
 await page.getByRole('button',{name:'Switch to English'}).click();
 const titleEn=footer.getByRole('heading',{name:'Follow Alhabib Center'});
 await expect(titleEn).toBeVisible();
 expect(await titleEn.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(255, 255, 255)');
 await expect(footer.getByRole('link',{name:'Open Alhabib Center on Instagram'})).toBeVisible();
});
