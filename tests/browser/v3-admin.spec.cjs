const {test,expect}=require('@playwright/test');
const {setTimeout:delay}=require('node:timers/promises');
/** Browser mocks authenticate only inside Playwright's test page. No real admin
 * account, production session, CMS record, Blob token or Neon data is changed. */
async function mockAdmin(page){
 let savedAbout=null;
 const records=[];
 await page.route('**/api/admin/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:'test-admin-id',role:'super_admin'}})}));
 await page.route('**/api/admin/storage-health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({backend:'postgres',ready:true,writeProtected:false})}));
 await page.route('**/api/cms',async route=>{
  const q=route.request().postDataJSON();
  if(q.action==='upsert'&&q.table==='site_settings'){
   records.push(q);
   if(q.payload?.key==='about_content')savedAbout=q.payload.value;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[{id:'about-test',...q.payload}],error:null})});
  }
  let data=[];
  if(q.table==='profiles')data=[{id:'test-admin-id',full_name:'مدير الاختبار',username:'preview-test',role:'super_admin',permissions:{settings:true},is_active:true}];
  if(q.table==='site_settings'&&q.filters?.some(x=>x.key==='key'&&x.value==='site_visuals')){
   await delay(700);
   data=[{key:'site_visuals',value:{hero:'/assets/team/hisham-hendawy.webp',heroFit:'cover'},is_public:true}];
  }else if(q.table==='site_settings'&&q.filters?.some(x=>x.key==='key'&&x.value==='about_content')&&savedAbout){
   data=[{key:'about_content',value:savedAbout,is_public:true}];
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data,error:null,count:q.head?data.length:null})});
 });
 return{records,getSavedAbout:()=>savedAbout};
}
test('admin image library never flashes a bundled hero while saved images load',async({page})=>{
 await mockAdmin(page);
 await page.goto('/admin/dashboard');
 await page.getByRole('button',{name:'الصور والأيقونات'}).click();
 await expect(page.getByText('جارٍ تحميل الصور المحفوظة من قاعدة البيانات...')).toBeVisible();
 await expect(page.locator('img[src="/assets/team/heba-alhabib.webp"]')).toHaveCount(0);
 await expect(page.locator('img[src="/assets/team/hisham-hendawy.webp"]').first()).toBeVisible();
 await expect(page.getByText('التحكم بحجم الصورة الرئيسية وتمركزها')).toBeVisible();
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
