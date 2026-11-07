/** Atomic and idempotent import of the approved clinic catalog. */
import {profiles,specialties} from './clinic-data';
import {builtinProfileId,seedProfile,seedSpecialty,CATALOG_SETTING_KEY,type CatalogMode} from './catalog';
import type {CmsStore} from './cms-store';
import {randomUUID} from 'node:crypto';

export type CatalogSection='team'|'specialties';
type RecordRow=Record<string,unknown>;
const createRow=(fields:RecordRow):RecordRow=>({id:randomUUID(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...fields});
const label=(value:unknown)=>typeof value==='string'?value.trim():'';

export function importClinicCatalog(store:CmsStore,module:CatalogSection){
 const serviceRows=store.tables.specialties ||= [];
 const teamRows=store.tables.specialists ||= [];
 const linkRows=store.tables.specialist_specialties ||= [];
 const settingRows=store.tables.site_settings ||= [];
 let addedSpecialties=0;let addedProfiles=0;let addedLinks=0;

 // Importing people also imports the specialties needed to filter them in booking.
 for(const service of specialties){
  const exists=serviceRows.some(r=>label(r.slug)===service.slug);
  if(!exists){serviceRows.push(createRow(seedSpecialty(service)));addedSpecialties++}
 }
 if(module==='team'){
  for(const person of profiles){
   const id=builtinProfileId(person.slug);
   const existing=teamRows.find(r=>r.id===id||label(r.name_ar)===person.nameAr);
   if(!existing){teamRows.push(createRow(seedProfile(person)));addedProfiles++}
   const record=existing||teamRows.find(r=>r.id===id);
   const service=specialties.find(s=>s.category===person.category);
   const target=serviceRows.find(r=>r.slug===service?.slug);
   if(record?.id&&target?.id&&!linkRows.some(r=>r.specialist_id===record.id)){
    linkRows.push(createRow({specialist_id:record.id,specialty_id:target.id}));addedLinks++;
   }
  }
 }
 const current=settingRows.find(r=>r.key===CATALOG_SETTING_KEY);
 const previous=current?.value&&typeof current.value==='object'&&!Array.isArray(current.value)?current.value as CatalogMode:{};
 const flags:CatalogMode={...previous,specialties:true,...(module==='team'?{team:true}:{})};
 if(current){current.value=flags;current.is_public=true;current.updated_at=new Date().toISOString()}
 else settingRows.push(createRow({key:CATALOG_SETTING_KEY,value:flags,is_public:true}));
 return {addedProfiles,addedSpecialties,addedLinks,totalProfiles:teamRows.length,totalSpecialties:serviceRows.length,enabled:flags};
}
