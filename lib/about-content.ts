/** Public-safe copy for the About page. The admin edits this published setting. */
export const ABOUT_CONTENT_KEY='about_content';
export const DEFAULT_ABOUT_CONTENT={
 pageTitleAr:'من نحن',
 pageTitleEn:'About Alhabib',
 subtitleAr:'رعاية متخصصة تضع احتياجات المراجع وأهدافه في قلب رحلة التأهيل.',
 subtitleEn:'Personalized care placing your needs at the heart of rehabilitation.',
 eyebrowAr:'رسالتنا',
 eyebrowEn:'OUR PURPOSE',
 headingAr:'كل خطوة تستحق العناية',
 headingEn:'Every step deserves care',
 bodyAr:'يقدم مركز الحبيب خدمات العلاج الطبيعي والتأهيل الطبي ومجالات مساندة تشمل صحة المرأة والتغذية والإرشاد النفسي. يعمل فريقنا على فهم احتياجات المراجع والتعاون معه ضمن مسار رعاية واضح.',
 bodyEn:'Alhabib offers physical therapy, rehabilitation and complementary services including women’s health, nutrition and psychological care.',
 cardTitleAr:'نهتم بالإنسان قبل الحالة',
 cardTitleEn:'People first',
 cardBodyAr:'نؤمن بأهمية الإصغاء، والوضوح، ووضع أهداف واقعية للرعاية والتأهيل.',
 cardBodyEn:'We value listening, clarity and realistic goals throughout the care journey.'
};
export type AboutContent=typeof DEFAULT_ABOUT_CONTENT;
export const ABOUT_FIELDS=Object.keys(DEFAULT_ABOUT_CONTENT) as (keyof AboutContent)[];
export function getAboutContent(value:unknown):AboutContent{
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const data={...DEFAULT_ABOUT_CONTENT};
 for(const key of ABOUT_FIELDS){
  const current=source[key];
  if(typeof current==='string'&&current.trim().length>0&&current.length<=3000)data[key]=current.trim();
 }
 return data;
}
