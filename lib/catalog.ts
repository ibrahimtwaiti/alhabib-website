/** Catalog reconciliation and seed helpers. The bundled catalog is an offline fallback.
 * Once an authorized admin activates the database catalogs, publication is controlled
 * exclusively by the private CMS publication flags; hidden records must never reappear from fallback.
 */
import {profiles, specialties, type Profile, type Specialty} from './clinic-data';
import {isAllowedImageUrl} from './image-urls';
import {approvedProfileMedia} from './approved-visual-media';

export const CATALOG_SETTING_KEY = 'published_catalog_mode';
export type CatalogMode = {team?:boolean; specialties?:boolean};

export const builtinProfileId = (slug:string) => {
  const index=profiles.findIndex(p=>p.slug===slug);
  return index<0?undefined:`a11ab1b0-2026-4000-8000-${String(index+1).padStart(12,'0')}`;
};
export const profileById = (id:string) => profiles.find(p=>builtinProfileId(p.slug)===id);
export function seedProfile(p:Profile){
  return {id:builtinProfileId(p.slug),name_ar:p.nameAr,name_en:p.nameEn,title_ar:p.titleAr,title_en:p.titleEn,
    bio_ar:p.summaryAr,bio_en:p.summaryEn,image_url:approvedProfileMedia(builtinProfileId(p.slug)||'')?.image_url||p.photo,department:p.department,
    qualifications:p.qualifications,conditions_ar:p.services,conditions_en:[],languages:[],is_published:true};
}
export function seedSpecialty(s:Specialty){
  return {slug:s.slug,name_ar:s.nameAr,name_en:s.nameEn,description_ar:s.introAr,
    description_en:s.introEn,image_url:s.image||null,department_scope:'both',is_published:true};
}
export type DbProfile={id:string;name_ar:string;name_en:string;title_ar:string;title_en:string;bio_ar:string;bio_en:string;image_url:string|null;photo_fit?:unknown;photo_position_x?:unknown;photo_position_y?:unknown;department:string;qualifications:unknown;conditions_ar:unknown;is_published?:boolean;specialist_specialties?:unknown};
export type DbSpecialty={id?:string;slug:string|null;name_ar:string;name_en:string;description_ar:string;description_en:string;image_url:string|null;is_published?:boolean};
const stringArray=(x:unknown):string[]=>Array.isArray(x)?x.filter((v):v is string=>typeof v==='string'):[];
const photoCoordinate=(value:unknown,fallback:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(100,Math.round(value))):fallback;
export function reconcileProfiles(records:DbProfile[],managed:boolean,categories:Record<string,string>={}):Profile[]{
  const team=managed?[]:profiles.map(p=>({...p,photo:approvedProfileMedia(builtinProfileId(p.slug)||'')?.image_url||p.photo}));
  for(const r of records){
    const base=profileById(r.id)||profiles.find(p=>p.nameAr===r.name_ar);
    const category=categories[r.id]||base?.category||'physical';
    const entry:Profile={slug:base?.slug||r.id,nameAr:r.name_ar||base?.nameAr||'',nameEn:r.name_en||base?.nameEn||'',
      titleAr:r.title_ar||base?.titleAr||'',titleEn:r.title_en||base?.titleEn||'',
      summaryAr:r.bio_ar||base?.summaryAr||'',summaryEn:r.bio_en||base?.summaryEn||'',
      department:r.department==='men'?'men':'women',category,
      photo:r.image_url&&isAllowedImageUrl(r.image_url)?r.image_url:approvedProfileMedia(r.id)?.image_url||base?.photo||'/assets/alhabib-logo.webp',
      photoFit:r.photo_fit==='cover'?'cover':'contain',
      photoPositionX:photoCoordinate(r.photo_position_x,50),photoPositionY:photoCoordinate(r.photo_position_y,100),
      qualifications:stringArray(r.qualifications).length?stringArray(r.qualifications):base?.qualifications||[],
      services:stringArray(r.conditions_ar).length?stringArray(r.conditions_ar):base?.services||[]};
    const index=team.findIndex(p=>p.slug===entry.slug||p.nameAr===r.name_ar);
    if(index>=0)team[index]=entry;else team.push(entry);
  }
  return team;
}
export function reconcileSpecialties(records:DbSpecialty[],managed:boolean):Specialty[]{
  const items=managed?[]:[...specialties];
  for(const r of records){
    if(!r.slug)continue;
    const base=specialties.find(s=>s.slug===r.slug);
    const entry:Specialty={slug:r.slug,nameAr:r.name_ar||base?.nameAr||'',nameEn:r.name_en||base?.nameEn||'',
      introAr:r.description_ar||base?.introAr||'',introEn:r.description_en||base?.introEn||'',
      icon:base?.icon||'sparkles',category:base?.category||'physical',image:r.image_url||undefined};
    const idx=items.findIndex(s=>s.slug===r.slug);
    if(idx>=0)items[idx]=entry;else items.push(entry);
  }
  return items;
}
