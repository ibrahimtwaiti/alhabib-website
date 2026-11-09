/** Public social profile links — kept in the CMS, never in browser-only overrides. */
export const SOCIAL_LINKS_KEY='social_links';
export const SOCIAL_PLATFORMS=['instagram','x','snapchat','tiktok'] as const;
export type SocialPlatform=(typeof SOCIAL_PLATFORMS)[number];
export type SocialLinks=Record<SocialPlatform,string>;

export const DEFAULT_SOCIAL_LINKS:SocialLinks={
 instagram:'https://www.instagram.com/alhabib_physio/',
 x:'https://x.com/AlhabibPhy85165',
 snapchat:'https://www.snapchat.com/add/alhabib_physio',
 tiktok:'https://www.tiktok.com/@alhabib_physio'
};
const HOSTS:Record<SocialPlatform,readonly string[]>={
 instagram:['instagram.com','www.instagram.com'],
 x:['x.com','www.x.com','twitter.com','www.twitter.com'],
 snapchat:['snapchat.com','www.snapchat.com'],
 tiktok:['tiktok.com','www.tiktok.com']
};
const VALID_PATH:Record<SocialPlatform,RegExp>={
 instagram:/^\/[A-Za-z0-9._]{1,30}\/?$/,
 x:/^\/[A-Za-z0-9_]{1,15}\/?$/,
 snapchat:/^\/add\/[A-Za-z0-9._-]{2,40}\/?$/,
 tiktok:/^\/@[A-Za-z0-9._]{2,32}\/?$/
};

/** Optional empty URL hides a network; any non-empty URL must point at a profile on that platform. */
export function isValidSocialProfileUrl(platform:SocialPlatform,value:string):boolean{
 const raw=value.trim();
 if(raw==='')return true;
 if(raw.length>500||/\s/.test(raw))return false;
 try{
  const url=new URL(raw);
  return url.protocol==='https:'&&!url.username&&!url.password&&
   HOSTS[platform].includes(url.hostname.toLowerCase())&&
   VALID_PATH[platform].test(url.pathname);
 }catch{return false}
}

/** Do not render untrusted CMS links if someone bypasses admin-side validation. */
export function getSocialLinks(value:unknown):SocialLinks{
 if(value===null||value===undefined)return {...DEFAULT_SOCIAL_LINKS};
 if(typeof value!=='object'||Array.isArray(value))return {...DEFAULT_SOCIAL_LINKS};
 const source=value as Record<string,unknown>;
 const result={...DEFAULT_SOCIAL_LINKS};
 for(const platform of SOCIAL_PLATFORMS){
  const url=source[platform];
  result[platform]=typeof url==='string'&&isValidSocialProfileUrl(platform,url)?url.trim():'';
 }
 return result;
}
export function socialHandle(platform:SocialPlatform,href:string):string{
 if(!href||!isValidSocialProfileUrl(platform,href))return '';
 try{
  const parts=new URL(href).pathname.split('/').filter(Boolean);
  const username=parts[parts.length-1]||'';
  return '@'+username.replace(/^@/,'');
 }catch{return ''}
}
