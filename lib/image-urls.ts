/** Validate image references without rejecting private Vercel Blob media routes. */
export function isAllowedImageUrl(value:string):boolean{
 const url=value.trim();
 if(!url)return true;
 if(/^\/assets\/[a-zA-Z0-9._~%/\-]+$/.test(url)&&!url.includes('..'))return true;
 if(/^\/api\/media\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i.test(url))return true;
 try{const parsed=new URL(url);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password}
 catch{return false}
}
