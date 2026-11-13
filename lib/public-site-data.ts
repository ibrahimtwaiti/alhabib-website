/** Visible site data only: converts CMS rows into content ready to render on the server.
 * Never serialize admin users, password hashes or unpublished CMS entries to clients.
 */
import {profiles,specialties,type Profile,type Specialty} from './clinic-data';
import {CATALOG_SETTING_KEY,builtinProfileId,reconcileProfiles,reconcileSpecialties,type CatalogMode,type DbProfile,type DbSpecialty} from './catalog';
import {isAllowedImageUrl} from './image-urls';
import {latestById} from './cms-dedupe';
import {linkedSpecialtySlugs} from './specialist-specialties';
import type {CmsStore} from './cms-store';
import type {SiteSection} from '@/components/admin-sections';
import type {SiteVisuals} from '@/components/use-site-visuals';
import {currentVisuals,getVisualBaseline} from './visual-baseline';
import {ABOUT_CONTENT_KEY,getAboutContent,type AboutContent} from './about-content';
import {SOCIAL_LINKS_KEY,getSocialLinks,type SocialLinks} from './social-links';

export type PublicArticle={id:string,title_ar:string,title_en:string,excerpt_ar:string,excerpt_en:string,body_ar:string,body_en:string,cover_image_url:string|null};
export type PublicAchievement={id:string,title_ar:string,title_en:string,description_ar:string,description_en:string,image_url:string|null};
export type PublicSiteData={people:Profile[];services:Specialty[];visuals:SiteVisuals;about:AboutContent;socialLinks:SocialLinks;articles:PublicArticle[];highlights:PublicAchievement[];sections:SiteSection[]};
type Row=Record<string,unknown>;
const text=(s:unknown)=>typeof s==='string'?s:'';
const items=(store:Pick<CmsStore,'tables'>,table:string):Row[]=>Array.isArray(store.tables?.[table])?store.tables[table]:[];
const sortBy=(list:Row[],key:string,asc:boolean)=>[...list].sort((a,b)=>{
 const aValue=text(a[key]),bValue=text(b[key]);
 return aValue<bValue?(asc?-1:1):aValue>bValue?(asc?1:-1):0;
});
const visualKeys=['logo','hero','feature_team','feature_specialties','feature_booking','feature_care','about_personal','about_team','about_whatsapp'] as const;
export function publicDataFromStore(store:Pick<CmsStore,'tables'>):PublicSiteData{
 const settings=items(store,'site_settings').filter(r=>r.is_public===true);
 const setting=(key:string)=>settings.find(r=>r.key===key)?.value;
 const mode=(setting(CATALOG_SETTING_KEY)||{}) as CatalogMode;
 const servicesRows=sortBy(latestById(items(store,'specialties')).filter(r=>r.is_published===true),'sort_order',true);
 const teamRows=sortBy(latestById(items(store,'specialists')).filter(r=>r.is_published===true),'sort_order',true);
 const links=items(store,'specialist_specialties');
 const categoryById:Record<string,string>={};
 for(const link of links){
  const target=servicesRows.find(s=>s.id===link.specialty_id);
  const base=specialties.find(s=>s.slug===target?.slug);
  if(base && typeof link.specialist_id==='string'&&!categoryById[link.specialist_id])categoryById[link.specialist_id]=base.category;
 }
 const baseline=getVisualBaseline(store);
 const people=reconcileProfiles(teamRows as unknown as DbProfile[],mode.team===true,categoryById).map(person=>{
  const row=teamRows.find(r=>r.id===person.slug||r.name_ar===person.nameAr);
  const linked=row&&typeof row.id==='string'?linkedSpecialtySlugs(row.id,links,servicesRows):undefined;
  const withSpecialties=linked?{...person,specialtySlugs:linked}:person;
  const approved=baseline.specialists[String(row?.id||builtinProfileId(person.slug)||'')];
  if(!approved||row?.image_url&&typeof row.image_url==='string'&&isAllowedImageUrl(row.image_url))return withSpecialties;
  return {...withSpecialties,photo:approved.image_url,photoFit:approved.photo_fit,
   photoPositionX:approved.photo_position_x,photoPositionY:approved.photo_position_y};
 });
 const icons=['activity','heart','brain','leaf','sparkles','shield'];
 const services=reconcileSpecialties(servicesRows as unknown as DbSpecialty[],mode.specialties===true).map(service=>{
  const approved=baseline.specialties[service.slug];
  const icon=icons.includes(approved?.icon||'')?approved!.icon as Specialty['icon']:service.icon;
  const image=service.image&&isAllowedImageUrl(service.image)?service.image:
   approved?.image_url&&isAllowedImageUrl(approved.image_url)?approved.image_url:undefined;
  return {...service,icon,image};
 });
 const visuals:SiteVisuals=currentVisuals(store);
 const articles=sortBy(items(store,'blog_posts').filter(r=>r.status==='published'),'published_at',false).slice(0,20).map(r=>({
  id:text(r.id),title_ar:text(r.title_ar),title_en:text(r.title_en),excerpt_ar:text(r.excerpt_ar),excerpt_en:text(r.excerpt_en),
  body_ar:text(r.body_ar),body_en:text(r.body_en),cover_image_url:typeof r.cover_image_url==='string'&&isAllowedImageUrl(r.cover_image_url)?r.cover_image_url:null
 }));
 const highlights=sortBy(items(store,'achievements').filter(r=>r.is_published===true),'created_at',false).slice(0,20).map(r=>({
  id:text(r.id),title_ar:text(r.title_ar),title_en:text(r.title_en),description_ar:text(r.description_ar),description_en:text(r.description_en),
  image_url:typeof r.image_url==='string'&&isAllowedImageUrl(r.image_url)?r.image_url:null
 }));
 const sections=sortBy(items(store,'dynamic_sections').filter(r=>r.is_enabled===true),'sort_order',true).slice(0,30) as unknown as SiteSection[];
 return {people,services,visuals,about:getAboutContent(setting(ABOUT_CONTENT_KEY)),socialLinks:getSocialLinks(setting(SOCIAL_LINKS_KEY)),articles,highlights,sections};
}
