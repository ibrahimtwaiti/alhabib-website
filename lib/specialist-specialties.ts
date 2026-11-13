import type {Profile,Specialty} from './clinic-data';

/** Prefer explicit CMS many-to-many links; only offline bundled profiles use a legacy category. */
export function matchesSpecialistSpecialty(
 person:Pick<Profile,'specialtySlugs'|'category'>,
 specialty:Pick<Specialty,'slug'|'category'>
):boolean{
 if(Array.isArray(person.specialtySlugs))return person.specialtySlugs.includes(specialty.slug);
 return person.category===specialty.category;
}

/** Resolve links to published specialty slugs, not legacy category strings.
 * Unknown/unpublished specialty links are omitted from the public booking model.
 */
export function linkedSpecialtySlugs(
 specialistId:string,
 links:ReadonlyArray<{specialist_id?:unknown;specialty_id?:unknown}>,
 specialties:ReadonlyArray<{id?:unknown;slug?:unknown}>
):string[]{
 const byId=new Map<string,string>();
 for(const specialty of specialties){
  if(typeof specialty.id==='string'&&typeof specialty.slug==='string')byId.set(specialty.id,specialty.slug);
 }
 return [...new Set(links.filter(row=>row.specialist_id===specialistId)
  .map(row=>typeof row.specialty_id==='string'?byId.get(row.specialty_id):undefined)
  .filter((slug):slug is string=>typeof slug==='string'))];
}
