const {test,expect}=require('@playwright/test');
test('admin uploads, previews, edits, schedules, reorders, configures and deletes advertisements',async({page})=>{
 await page.setExtraHTTPHeaders({'x-alhabib-test-admin':'1'});
 let ads=[],revision='initial',settings={autoplay:true,interval_ms:6000,transition_ms:450,transition:'fade',show_arrows:true,show_dots:true},serial=0;
 await page.route('**/api/admin/session',r=>r.fulfill({json:{user:{id:'test',role:'super_admin'}}}));
 await page.route('**/api/admin/storage-health',r=>r.fulfill({json:{ready:true,writeProtected:false}}));
 await page.route('**/api/cms',r=>{const q=r.request().postDataJSON();return r.fulfill({json:{data:q.table==='profiles'?[{id:'test',role:'super_admin',is_active:true,full_name:'مدير الاختبار'}]:[],error:null,count:0}})});
 await page.route('**/api/admin/upload',r=>r.fulfill({json:{path:'media/00000000-0000-4000-8000-000000000001.webp'}}));
 await page.route('**/api/admin/advertising',r=>{
  if(r.request().method()==='POST'){
   const b=r.request().postDataJSON();
   if(b.revision!==revision)return r.fulfill({status:409,json:{error:'تعارض'}});
   if(b.action==='save'){const id=b.id||'00000000-0000-4000-8000-'+String(++serial).padStart(12,'0'),a={...b.ad,id,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};ads=b.id?ads.map(old=>old.id===id?a:old):[...ads,a]}
   if(b.action==='delete')ads=ads.filter(a=>a.id!==b.id);
   if(b.action==='reorder')ads=b.ids.map((id,i)=>({...ads.find(a=>a.id===id),sort_order:i}));
   if(b.action==='settings')settings=b.settings;
   revision=String(Number(revision==='initial'?0:revision)+1);
  }
  return r.fulfill({json:{ads,settings,revision}});
 });
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'إدارة الإعلانات',exact:true}).click();
 const form=page.getByRole('form',{name:'بيانات الإعلان'});
 await expect(page.getByText('لم تُضف إعلانات بعد.',{exact:false})).toBeVisible();
 await form.getByLabel('الصورة الرئيسية',{exact:true}).setInputFiles('public/assets/alhabib-logo.webp');
 await expect(form.getByRole('img',{name:'معاينة الصورة الرئيسية'})).toBeVisible();
 await form.getByLabel('صورة الهاتف (اختياري)',{exact:true}).setInputFiles('public/assets/team/heba-alhabib.webp');
 await form.getByLabel('عنوان الإعلان (اختياري)',{exact:true}).fill('عرض أول');
 await form.getByLabel('النص البديل للصورة',{exact:false}).fill('وصف الصورة');
 await form.getByLabel('رابط الإعلان (اختياري)',{exact:true}).fill('/booking');
 await form.getByRole('button',{name:'حفظ الإعلان',exact:true}).click();
 await expect.poll(()=>ads.length).toBe(1);expect(ads[0].mobile_image_url).toContain('/api/media/');
 const first=page.locator('[data-ad-row]').first();
 await first.getByRole('button',{name:'تعديل',exact:true}).click();
 await form.getByLabel('موضع الإعلان',{exact:true}).selectOption('home_middle');
 await form.getByLabel('نهاية العرض',{exact:true}).fill('2030-01-01T12:00');
 await form.getByRole('button',{name:'حفظ الإعلان',exact:true}).click();
 await expect.poll(()=>ads[0].placement).toBe('home_middle');expect(ads[0].ends_at).toMatch(/Z$/);
 await first.getByRole('button',{name:'تعطيل',exact:true}).click();await expect.poll(()=>ads[0].is_active).toBe(false);
 await first.getByRole('button',{name:'تفعيل',exact:true}).click();await expect.poll(()=>ads[0].is_active).toBe(true);
 await form.getByLabel('الصورة الرئيسية',{exact:true}).setInputFiles('public/assets/alhabib-logo.webp');
 await form.getByLabel('عنوان الإعلان (اختياري)',{exact:true}).fill('عرض ثان');
 await form.getByLabel('النص البديل للصورة',{exact:false}).fill('الصورة الثانية');
 await form.getByRole('button',{name:'حفظ الإعلان',exact:true}).click();await expect.poll(()=>ads.length).toBe(2);
 await page.getByRole('button',{name:'تقديم عرض ثان',exact:true}).click();await expect.poll(()=>ads[0].title).toBe('عرض ثان');
 const handle=page.getByRole('button',{name:'اسحب لترتيب عرض ثان',exact:true});
 const target=page.locator('[data-ad-row]').nth(1);const box=await target.boundingBox();
 await handle.hover();await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:8});await page.mouse.up();
 await expect.poll(()=>ads[0].title).toBe('عرض أول');
 const motion=page.getByRole('form',{name:'إعدادات الحركة'});
 await motion.getByLabel('مدة عرض الإعلان (ثانية)',{exact:true}).fill('9');
 await motion.getByLabel('نوع الحركة',{exact:true}).selectOption('slide');
 await motion.getByLabel('التشغيل التلقائي',{exact:true}).uncheck();
 await motion.getByRole('button',{name:'حفظ إعدادات الحركة'}).click();await expect.poll(()=>settings.interval_ms).toBe(9000);expect(settings.autoplay).toBe(false);
 page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'حذف عرض أول',exact:true}).click();await expect.poll(()=>ads.length).toBe(1);
 await page.getByRole('button',{name:'حذف عرض ثان',exact:true}).click();await expect.poll(()=>ads.length).toBe(0);
 await expect(page.locator('[data-ad-row]')).toHaveCount(0);
});
