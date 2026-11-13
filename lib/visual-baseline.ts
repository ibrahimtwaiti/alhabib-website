import {randomUUID} from 'node:crypto';
import {isAllowedImageUrl} from './image-urls';
import type {CmsStore} from './cms-store';
const newRow=(data:Record<string,unknown>)=>({...data,id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
import {approvedPhotos,type ProfileMedia} from './approved-visual-media';
import type {SiteVisuals} from '@/components/use-site-visuals';

/** The first approved default is the last persisted public visual state, not bundled V1 photos.
 * This is a manifest of public media references; original media must remain in Vercel Blob.
 * Subsequent approved snapshots live in the CMS and replace this seed.
 */
export const VISUAL_BASELINE_KEY='visual_baseline_v1';
const keys=['logo','hero','feature_team','feature_specialties','feature_booking','feature_care','about_personal','about_team','about_whatsapp'] as const;
type ImageKey=(typeof keys)[number];
type SpecialtyMedia={image_url:string|null;icon?:string};
export type VisualBaseline={version:1;approved_at:string;visuals:SiteVisuals;specialists:Record<string,ProfileMedia>;specialties:Record<string,SpecialtyMedia>};
const seed:VisualBaseline={version:1,approved_at:'2026-11-08T23:39:36.666Z',
 visuals:{logo:'/assets/alhabib-logo.webp',hero:'/api/media/media/e4250b83-1ccf-4f94-9d96-1e1ac998251c.webp'},
 specialists:approvedPhotos,specialties:{}};
const copy=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const rows=(store:Pick<CmsStore,'tables'>,table:string)=>store.tables?.[table]||[];
const numeric=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):fallback;
const validImage=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&isAllowedImageUrl(v);
function sanitizeVisuals(input:unknown):SiteVisuals{
 const next:SiteVisuals={};
 if(!input||typeof input!=='object'||Array.isArray(input))return next;
 const obj=input as Record<string,unknown>;
 for(const key of keys)if(validImage(obj[key]))next[key]=obj[key] as string;
 if(obj.heroFit==='cover'||obj.heroFit==='contain')next.heroFit=obj.heroFit;
 for(const key of ['heroPositionX','heroPositionY'] as const)
  if(typeof obj[key]==='number'&&Number.isFinite(obj[key]))next[key]=numeric(obj[key],50);
 return next;
}
function validSnapshot(value:unknown):value is VisualBaseline{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return v.version===1&&typeof v.approved_at==='string'&&!!v.visuals&&typeof v.visuals==='object'&&
 !!v.specialists&&typeof v.specialists==='object'&&!Array.isArray(v.specialists)&&
 !!v.specialties&&typeof v.specialties==='object'&&!Array.isArray(v.specialties);
}
export function getVisualBaseline(store:Pick<CmsStore,'tables'>):VisualBaseline{
 const candidate=rows(store,'site_settings').find(r=>r.key===VISUAL_BASELINE_KEY)?.value;
 if(!validSnapshot(candidate))return copy(seed);
 const images:Record<string,ProfileMedia>={};
 for(const [id,entry] of Object.entries(candidate.specialists)){
  if(!/^[a-f0-9-]{36}$/i.test(id)||!entry||typeof entry!=='object')continue;
  const v=entry as unknown as Record<string,unknown>;
  if(!validImage(v.image_url))continue;
  images[id]={image_url:v.image_url,photo_fit:v.photo_fit==='contain'?'contain':'cover',
   photo_position_x:numeric(v.photo_position_x,50),photo_position_y:numeric(v.photo_position_y,50)};
 }
 const specialties:Record<string,SpecialtyMedia>={};
 for(const [slug,entry] of Object.entries(candidate.specialties)){
  if(!/^[a-z0-9-]{2,80}$/.test(slug)||!entry||typeof entry!=='object')continue;
  const v=entry as unknown as Record<string,unknown>;
  specialties[slug]={image_url:validImage(v.image_url)?v.image_url:null,
   ...(typeof v.icon==='string'&&/^(activity|heart|brain|leaf|sparkles|shield)$/.test(v.icon)?{icon:v.icon}:{})};
 }
 return {version:1,approved_at:candidate.approved_at,visuals:sanitizeVisuals(candidate.visuals),specialists:images,specialties};
}
export function currentVisuals(store:Pick<CmsStore,'tables'>):SiteVisuals{
 const baseline=getVisualBaseline(store);
 const saved=rows(store,'site_settings').find(r=>r.key==='site_visuals'&&r.is_public===true)?.value;
 return {...baseline.visuals,...sanitizeVisuals(saved)};
}
export function captureVisualBaseline(store:CmsStore):VisualBaseline{
 const previous=getVisualBaseline(store);
 const specialists=copy(previous.specialists);
 for(const row of rows(store,'specialists')){
  if(typeof row.id!=='string'||!validImage(row.image_url))continue;
  specialists[row.id]={image_url:row.image_url,photo_fit:row.photo_fit==='contain'?'contain':'cover',
   photo_position_x:numeric(row.photo_position_x,50),photo_position_y:numeric(row.photo_position_y,50)};
 }
 const specialties=copy(previous.specialties);
 for(const row of rows(store,'specialties')){
  if(typeof row.slug!=='string')continue;
  specialties[row.slug]={image_url:validImage(row.image_url)?row.image_url:null,
   ...(typeof row.icon==='string'&&/^(activity|heart|brain|leaf|sparkles|shield)$/.test(row.icon)?{icon:row.icon}:{})};
 }
 const baseline:VisualBaseline={version:1,approved_at:new Date().toISOString(),visuals:currentVisuals(store),specialists,specialties};
 const settings=store.tables.site_settings ||= [];
 const found=settings.find(r=>r.key===VISUAL_BASELINE_KEY);
 if(found){found.value=copy(baseline);found.updated_at=baseline.approved_at}
 else settings.push(newRow({key:VISUAL_BASELINE_KEY,value:copy(baseline),is_public:false}));
 return baseline;
}
/** Restore only images and their crop/icon settings. Never overwrite biography, accounts, or unrelated content. */
export function restoreVisualBaseline(store:CmsStore):VisualBaseline{
 const baseline=getVisualBaseline(store);
 const settings=store.tables.site_settings ||= [];
 const visuals=settings.find(r=>r.key==='site_visuals');
 if(visuals){visuals.value=copy(baseline.visuals);visuals.updated_at=new Date().toISOString();visuals.is_public=true}
 else settings.push(newRow({key:'site_visuals',value:copy(baseline.visuals),is_public:true}));
 for(const row of rows(store,'specialists')){
  if(typeof row.id!=='string')continue;
  const approved=baseline.specialists[row.id];
  if(!approved)continue;
  row.image_url=approved.image_url;row.photo_fit=approved.photo_fit;
  row.photo_position_x=approved.photo_position_x;row.photo_position_y=approved.photo_position_y;
  row.updated_at=new Date().toISOString();
 }
 for(const row of rows(store,'specialties')){
  if(typeof row.slug!=='string')continue;
  const approved=baseline.specialties[row.slug];if(!approved)continue;
  row.image_url=approved.image_url;
  if(approved.icon)row.icon=approved.icon;
  row.updated_at=new Date().toISOString();
 }
 return baseline;
}
