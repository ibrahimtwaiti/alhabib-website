export type VisualSettings={specialties:Record<string,{image?:string;icon?:string}>;heroImage?:string};
export const visualIcons=['activity','heart','brain','leaf','sparkles','shield'] as const;
export const defaultVisualSettings:VisualSettings={specialties:{}};
export function safeVisualUrl(url:string){if(url.startsWith('/assets/'))return url;try{const u=new URL(url);return u.protocol==='https:'?url:''}catch{return ''}}
