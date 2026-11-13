const {test,expect}=require('@playwright/test');
const {setTimeout:delay}=require('node:timers/promises');
/** Browser mocks authenticate only inside Playwright's test page. No real admin
 * account, production session, CMS record, Blob token or Neon data is changed. */
async function mockAdmin(page,options={}){
 let savedAbout=null;
 let savedSocial=null;
 const records=[];
 const savedSpecialists=[];
 const dynamicSpecialties=[...(options.specialties||[])];
 const specialistRecords=[...(options.specialists||[])];
 const links=[...(options.links||[])];
 await page.route('**/api/admin/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:'test-admin-id',role:'super_admin'}})}));
 await page.route('**/api/admin/storage-health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({backend:'postgres',ready:true,writeProtected:false})}));
 let baseline={approved_at:'2026-11-13T00:00:00.000Z',visuals:{hero:'/assets/team/hisham-hendawy.webp'},specialists:{'demo':{image_url:'/assets/team/hisham-hendawy.webp'}}};
 await page.route('**/api/admin/visual-baseline',route=>{
  if(route.request().method()==='POST'){const body=route.request().postDataJSON();if(body.action==='capture')baseline={...baseline,approved_at:'2026-11-13T01:00:00.000Z'};return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,baseline})});}
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({baseline})});
 });
 await page.route('**/api/admin/specialists/save',route=>{
  savedSpecialists.push(route.request().postDataJSON());
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,specialistId:savedSpecialists.at(-1).specialistId,specialtyIds:savedSpecialists.at(-1).specialtyIds})});
 });
 await page.route('**/api/cms',async route=>{
  const q=route.request().postDataJSON();
  if(q.action==='upsert'&&q.table==='site_settings'){
   records.push(q);
   if(q.payload?.key==='about_content')savedAbout=q.payload.value;
   if(q.payload?.key==='social_links')savedSocial=q.payload.value;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[{id:'about-test',...q.payload}],error:null})});
  }
  if(q.action==='insert'&&q.table==='specialties'){
   const created={id:'99999999-0000-4000-8000-000000000009',...q.payload};
   dynamicSpecialties.push(created);
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[created],error:null})});
  }
  let data=[];
  if(q.table==='profiles')data=[{id:'test-admin-id',full_name:'مدير الاختبار',username:'preview-test',role:'super_admin',permissions:{settings:true},is_active:true}];
  if(q.table==='specialties'&&q.action==='select')data=dynamicSpecialties;
  if(q.table==='specialist_specialties'&&q.action==='select')data=links;
  if(q.table==='specialists'&&q.action==='select')data=specialistRecords;
  if(q.table==='specialists'&&q.action==='select'&&q.selection==='*')await delay(650);
  if(q.table==='site_settings'&&q.filters?.some(x=>x.key==='key'&&x.value==='site_visuals')){
   await delay(700);
   data=[{key:'site_visuals',value:{hero:'/assets/team/hisham-hendawy.webp',heroFit:'cover'},is_public:true}];
  }else if(q.table==='site_settings'&&q.filters?.some(x=>x.key==='key'&&x.value==='about_content')&&savedAbout){
   data=[{key:'about_content',value:savedAbout,is_public:true}];
  }else if(q.table==='site_settings'&&q.filters?.some(x=>x.key==='key'&&x.value==='social_links')&&savedSocial){
   data=[{key:'social_links',value:savedSocial,is_public:true}];
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data,error:null,count:q.head?data.length:null})});
 });
 return{records,getSavedAbout:()=>savedAbout,getSavedSocial:()=>savedSocial,getSavedSpecialists:()=>savedSpecialists};
}
test('admin image library never flashes a bundled hero while saved images load',async({page})=>{
 await mockAdmin(page);
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'الصور والأيقونات'}).click();
 await expect(page.getByText('جارٍ تحميل الصور المحفوظة من قاعدة البيانات...')).toBeVisible();
 await expect(page.locator('img[src="/assets/team/heba-alhabib.webp"]')).toHaveCount(0);
 await expect(page.locator('img[src="/assets/team/hisham-hendawy.webp"]').first()).toBeVisible();
 await expect(page.getByText('التحكم بحجم الصورة الرئيسية وتمركزها')).toBeVisible();
 await page.getByRole('textbox',{name:'رابط الصورة الرئيسية الكبيرة'}).fill('/assets/team/heba-alhabib.webp');
 await expect(page.locator('img[src="/assets/team/hisham-hendawy.webp"]')).toHaveCount(0);
 await expect(page.locator('img[src="/assets/team/heba-alhabib.webp"]')).toBeVisible();
});
test('admin About page supports bilingual preview and saves published CMS content',async({page})=>{
 const mock=await mockAdmin(page);
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'من نحن'}).click();
 await expect(page.locator('#about-headingAr')).toHaveValue('كل خطوة تستحق العناية');
 await page.locator('#about-headingAr').fill('عنوان تجريبي جديد للمركز');
 await expect(page.getByText('عنوان تجريبي جديد للمركز').last()).toBeVisible();
 await page.getByLabel('لغة المعاينة').selectOption('en');
 await expect(page.getByText('Every step deserves care')).toBeVisible();
 await page.getByRole('button',{name:'حفظ ونشر التعديلات'}).click();
 await expect(page.getByText(/تم نشر تحديث «من نحن» بنجاح/)).toBeVisible();
 expect(mock.records).toHaveLength(1);
 expect(mock.getSavedAbout().headingAr).toBe('عنوان تجريبي جديد للمركز');
 expect(mock.records[0].payload.is_public).toBe(true);
});

test('team photo editor waits for saved CMS profiles before rendering its cards',async({page})=>{
 await mockAdmin(page);
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'الأخصائيون'}).click();
 await expect(page.getByText(/جارٍ تحميل الصور المحفوظة/)).toBeVisible();
 await expect(page.locator('.profile-card')).toHaveCount(0);
 await expect(page.getByText('فريق المركز والصور الشخصية')).toBeVisible();
 await expect(page.getByRole('button',{name:/تعديل /}).first()).toBeVisible();
});

test('site settings edit official social profile links and publish through CMS',async({page})=>{
 const mock=await mockAdmin(page);
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'إعدادات الموقع'}).click();
 await expect(page.locator('#social-instagram')).toHaveValue('https://www.instagram.com/alhabib_physio/');
 await expect(page.locator('#social-x')).toHaveValue('https://x.com/AlhabibPhy85165');
 await expect(page.locator('#social-snapchat')).toHaveValue('https://www.snapchat.com/add/alhabib_physio');
 await expect(page.locator('#social-tiktok')).toHaveValue('https://www.tiktok.com/@alhabib_physio');
 await page.locator('#social-x').fill('https://x.com/AlhabibCare');
 await page.getByRole('button',{name:'حفظ ونشر الحسابات'}).click();
 await expect(page.getByText(/تم حفظ روابط حسابات المركز ونشرها بنجاح/)).toBeVisible();
 expect(mock.getSavedSocial().x).toBe('https://x.com/AlhabibCare');
 expect(mock.records.some(x=>x.payload?.key==='social_links'&&x.payload?.is_public===true&&x.onConflict==='key')).toBe(true);
 await page.locator('#social-snapchat').fill('https://attacker.example/bad');
 await page.getByRole('button',{name:'حفظ ونشر الحسابات'}).click();
 await expect(page.getByRole('alert').filter({hasText:'رابط Snapchat غير صالح'})).toBeVisible();
 expect(mock.records.filter(x=>x.payload?.key==='social_links')).toHaveLength(1);
});

test('super admin can approve and restore image defaults without using old V1 fallbacks',async({page})=>{
 await mockAdmin(page);
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'الصور والأيقونات'}).click();
 await expect(page.getByRole('region',{name:'النسخة الافتراضية المعتمدة'})).toBeVisible();
 await page.getByRole('button',{name:'اعتماد الحالة الحالية كافتراضية'}).click();
 await expect(page.getByText('تم اعتماد الحالة الحالية كنسخة افتراضية قابلة للاستعادة.')).toBeVisible();
 await page.getByRole('button',{name:'استعادة النسخة الافتراضية'}).click();
 await expect(page.getByText('تمت استعادة الصور والأيقونات الافتراضية المعتمدة.')).toBeVisible();
});

test('admin supports multiple specialties and newly created specialties in filtering options',async({page})=>{
 const id='a11ab1b0-2026-4000-8000-000000000001';
 const primary='11111111-0000-4000-8000-000000000001';
 const sports='11111111-0000-4000-8000-000000000002';
 const fixture=await mockAdmin(page,{
  specialists:[{id,name_ar:'هشام هنداوي',name_en:'Hisham Hendawy',department:'men',image_url:'/assets/team/hisham-hendawy.webp',is_published:true}],
  specialties:[
   {id:primary,slug:'physical-therapy',name_ar:'العلاج الطبيعي',is_published:true},
   {id:sports,slug:'sports-rehabilitation',name_ar:'التأهيل الرياضي',is_published:true}
  ],
  links:[{specialist_id:id,specialty_id:primary}]
 });
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'التخصصات',exact:true}).click();
 await page.locator('#catalog-slug').fill('advanced-rehabilitation');
 await page.locator('#catalog-name_ar').fill('التأهيل المتقدم');
 await page.locator('#catalog-name_en').fill('Advanced Rehabilitation');
 await page.getByRole('button',{name:'حفظ التعديلات'}).click();
 await expect(page.getByText(/تم حفظ التغييرات/)).toBeVisible();
 await page.getByRole('button',{name:'الأخصائيون',exact:true}).click();
 await page.getByRole('button',{name:'تعديل هشام هنداوي'}).click();
 const group=page.getByRole('group',{name:'اختيار تخصصات الأخصائي'});
 await expect(group.getByRole('checkbox',{name:'العلاج الطبيعي'})).toBeChecked();
 await expect(group.getByRole('checkbox',{name:'التأهيل الرياضي'})).not.toBeChecked();
 await expect(group.getByRole('checkbox',{name:'التأهيل المتقدم'})).not.toBeChecked();
 await group.getByRole('checkbox',{name:'التأهيل الرياضي'}).check();
 await group.getByRole('checkbox',{name:'التأهيل المتقدم'}).check();
 await expect(page.getByText('التخصصات المحددة: 3 من 3')).toBeVisible();
 await page.getByRole('button',{name:'حفظ التعديلات'}).click();
 await expect.poll(()=>fixture.getSavedSpecialists().length).toBe(1);
 const saved=fixture.getSavedSpecialists()[0];
 expect(saved.specialistId).toBe(id);
 expect(saved.specialtyIds).toEqual(expect.arrayContaining([primary,sports,'99999999-0000-4000-8000-000000000009']));
 expect(saved.specialtyIds).toHaveLength(3);
});
