/** Image links accepted by the public website and admin panel. */
export function isAllowedImageUrl(value:string):boolean{
 const url=value.trim();
 if(!url)return true;
 if(/^\/assets\/[a-zA-Z0-9._~%/-]+$/.test(url)&&!url.includes('..')&&!url.includes('//'))return true;
 if(/^\/api\/media\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i.test(url))return true;
 try{
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password)return false;
  if(/^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/i.test(parsed.hostname))return false;
  return true;
 }catch{return false}
}
export const IMAGE_LINK_HELP='ضع رابط HTTPS مباشر للصورة (وليس رابط صفحة مشاركة)، أو مسار صورة داخل الموقع.';
