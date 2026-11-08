'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/cms-client';
export const VISUAL_KEY='site_visuals';
export type SiteVisuals=Partial<Record<'logo'|'hero'|'feature_team'|'feature_specialties'|'feature_booking'|'feature_care'|'about_personal'|'about_team'|'about_whatsapp',string>> & {
 /** Hero crop controls are stored with the public site settings. */
 heroFit?:'cover'|'contain';heroPositionX?:number;heroPositionY?:number;
};
export const visualFields=[
 ['logo','شعار المركز في الهيدر والفوتر'],
 ['hero','الصورة الرئيسية الكبيرة'],
 ['feature_team','أيقونة الفريق في الشريط العلوي'],
 ['feature_specialties','أيقونة التخصصات في الشريط العلوي'],
 ['feature_booking','أيقونة الحجز في الشريط العلوي'],
 ['feature_care','أيقونة العناية في الشريط العلوي'],
 ['about_personal','أيقونة خطط التأهيل'],
 ['about_team','أيقونة الكوادر'],
 ['about_whatsapp','أيقونة التواصل']
] as const;
export function useSiteVisuals(){
 const [visuals,setVisuals]=useState<SiteVisuals>({});
 useEffect(()=>{let alive=true;(async()=>{try{const db=createClient();const [preferred,previous]=await Promise.all([db.from('site_settings').select('value').eq('key',VISUAL_KEY).eq('is_public',true).maybeSingle(),db.from('site_settings').select('value').eq('key','specialty_visuals').eq('is_public',true).maybeSingle()]);if(alive){const old=(previous.data?.value as {heroImage?:string}|null)?.heroImage;const custom=preferred.data?.value as SiteVisuals|null;setVisuals({...(old?{hero:old}:{}),...(custom||{})});}}catch{}})();return()=>{alive=false}},[]);
 return visuals;
}
