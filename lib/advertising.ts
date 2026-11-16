import {isAllowedImageUrl} from './image-urls';

export const PLACEMENTS=['home_top','home_middle','before_footer','services'] as const;
export type AdPlacement=typeof PLACEMENTS[number];
export type Advertisement={
 id:string;title:string;description:string;alt:string;image_url:string;mobile_image_url:string;
 target_url:string;is_active:boolean;sort_order:number;placement:AdPlacement;
 starts_at:string|null;ends_at:string|null;created_at:string;updated_at:string;
};
export type AdSettings={autoplay:boolean;interval_ms:number;transition_ms:number;transition:'fade'|'slide'|'none';show_arrows:boolean;show_dots:boolean};
export const DEFAULT_AD_SETTINGS:AdSettings={autoplay:true,interval_ms:6000,transition_ms:450,transition:'fade',show_arrows:true,show_dots:true};
export type AdvertisingSnapshot={ads:Advertisement[];settings:AdSettings;revision:string};
export type PublicAdvertising={ads:Advertisement[];settings:AdSettings;server_now:number;next_change_at:number|null};
type Tables={tables:Record<string,Record<string,unknown>[]>};
export function validTarget(value:string){
 if(!value)return true;
 if(value.startsWith('/')&&!value.startsWith('//')&&!/[\\\s]/.test(value))return true;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password}catch{return false}
}
const obj=(value:unknown):Record<string,unknown>=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('البيانات غير صالحة');
 return value as Record<string,unknown>;
};
const string=(value:unknown,max:number,required=false)=>{
 if(typeof value!=='string'||value.length>max||required&&!value.trim())throw Error('تحقق من النصوص والحقول المطلوبة');
 return value.trim();
};
const number=(value:unknown,min:number,max:number)=>{
 if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)throw Error('القيمة الرقمية خارج النطاق المسموح');
 return value;
};
const boolean=(value:unknown)=>{if(typeof value!=='boolean')throw Error('حالة التفعيل غير صالحة');return value};
function date(value:unknown){
 if(value===null||value==='')return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('تاريخ العرض غير صالح');
 return new Date(value).toISOString();
}
export function validateAd(value:unknown):Omit<Advertisement,'id'|'created_at'|'updated_at'>{
 const r=obj(value);
 const image_url=string(r.image_url,2048,true),mobile_image_url=string(r.mobile_image_url,2048);
 if(!isAllowedImageUrl(image_url)||!isAllowedImageUrl(mobile_image_url))throw Error('رابط الصورة غير صالح');
 const target_url=string(r.target_url,2048);
 if(!validTarget(target_url))throw Error('استخدم رابط HTTPS أو مساراً داخل الموقع');
 const placement=r.placement as AdPlacement;
 if(!PLACEMENTS.includes(placement))throw Error('موضع الإعلان غير صالح');
 const starts_at=date(r.starts_at),ends_at=date(r.ends_at);
 if(starts_at&&ends_at&&Date.parse(ends_at)<=Date.parse(starts_at))throw Error('نهاية العرض يجب أن تكون بعد بدايته');
 return {title:string(r.title,160),description:string(r.description,500),alt:string(r.alt,250,true),
 image_url,mobile_image_url,target_url,is_active:boolean(r.is_active),sort_order:number(r.sort_order,0,10000),placement,starts_at,ends_at};
}
export function validateAdSettings(value:unknown):AdSettings{
 const r=obj(value);
 if(!['fade','slide','none'].includes(String(r.transition)))throw Error('نوع الحركة غير صالح');
 return {autoplay:boolean(r.autoplay),interval_ms:number(r.interval_ms,3000,60000),
 transition_ms:number(r.transition_ms,100,1500),transition:r.transition as AdSettings['transition'],
 show_arrows:boolean(r.show_arrows),show_dots:boolean(r.show_dots)};
}
export function advertisingSnapshot(store:Tables):AdvertisingSnapshot{
 const ads:Advertisement[]=[];
 for(const r of store.tables.advertisements||[]){
  try{if(typeof r.id==='string')ads.push({...validateAd(r),id:r.id,created_at:String(r.created_at||''),updated_at:String(r.updated_at||'')})}catch{/* Invalid legacy entries never render. */}
 }
 const config=store.tables.advertising_config?.[0];
 let settings={...DEFAULT_AD_SETTINGS};
 try{if(config?.settings)settings=validateAdSettings(config.settings)}catch{/* Safe defaults for corrupt configuration. */}
 return {ads:ads.sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id)),settings,revision:typeof config?.revision==='string'?config.revision:'initial'};
}
export function isAdActive(ad:Advertisement,now:number){
 return ad.is_active&&(!ad.starts_at||Date.parse(ad.starts_at)<=now)&&(!ad.ends_at||Date.parse(ad.ends_at)>now);
}
export function publicAdvertising(store:Tables,now=Date.now()):PublicAdvertising{
 const {ads,settings}=advertisingSnapshot(store);
 const boundaries=ads.filter(ad=>ad.is_active&&(!ad.ends_at||Date.parse(ad.ends_at)>now))
 .flatMap(ad=>[ad.starts_at,ad.ends_at].filter(Boolean).map(d=>Date.parse(d!))).filter(t=>t>now);
 return {ads:ads.filter(ad=>isAdActive(ad,now)),settings,server_now:now,next_change_at:boundaries.length?Math.min(...boundaries):null};
}
