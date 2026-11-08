'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/cms-client';
import {profiles,specialties,type Profile,type Specialty} from '@/lib/clinic-data';
import {CATALOG_SETTING_KEY,reconcileProfiles,reconcileSpecialties,type CatalogMode,type DbProfile,type DbSpecialty} from '@/lib/catalog';

export function useClinicCatalog(){
  const [people,setPeople]=useState<Profile[]>(profiles);
  const [services,setServices]=useState<Specialty[]>(specialties);
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const db=createClient();
        const [settings,team,specialtiesResult,links,legacyVisuals]=await Promise.all([
          db.from('site_settings').select('value').eq('key',CATALOG_SETTING_KEY).eq('is_public',true).maybeSingle(),
          db.from('specialists').select('id,name_ar,name_en,title_ar,title_en,bio_ar,bio_en,image_url,department,qualifications,conditions_ar').eq('is_published',true).order('sort_order',{ascending:true}),
          db.from('specialties').select('id,slug,name_ar,name_en,description_ar,description_en,image_url').eq('is_published',true).order('sort_order',{ascending:true}),
          db.from('specialist_specialties').select('specialist_id,specialty_id'),
          db.from('site_settings').select('value').eq('key','specialty_visuals').eq('is_public',true).maybeSingle()
        ]);
        if(!active)return;
        const mode=(settings.data?.value||{}) as CatalogMode;
        // If a catalog has been activated, its published rows become authoritative, including an empty list.
        const categoryById:Record<string,string>={};
        for(const link of links.data||[]){const service=(specialtiesResult.data||[]).find((x:{id:string;slug:string})=>x.id===link.specialty_id);const catalog=specialties.find(s=>s.slug===service?.slug);if(catalog)categoryById[link.specialist_id]=catalog.category;}
        if(!team.error)setPeople(reconcileProfiles((team.data||[]) as DbProfile[],mode.team===true,categoryById));
        if(!specialtiesResult.error){const rows=reconcileSpecialties((specialtiesResult.data||[]) as DbSpecialty[],mode.specialties===true);
          const previous=(legacyVisuals.data?.value as {specialties?:Record<string,{image?:string;icon?:string}>}|null)?.specialties||{};
          const icons=['activity','heart','brain','leaf','sparkles','shield'];
          setServices(rows.map(s=>{const setting=previous[s.slug];const icon=icons.includes(setting?.icon||'')?setting.icon as typeof s.icon:s.icon;
            const image=s.image||(setting?.image&&(/^https:\/\//.test(setting.image)||setting.image.startsWith('/assets/'))?setting.image:undefined);return {...s,icon,image}}));
        }
      }catch{/* The bundled catalog provides a graceful read-only fallback when the CMS service is temporarily unreachable. */}
    })();
    return()=>{active=false};
  },[]);
  return {people,services};
}
