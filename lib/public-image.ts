/** Preserve the admin's HTTPS image URLs; let Next optimize only local paths.
 * External hosts supplied in CMS stay directly loadable without remotePattern surprises.
 */
export function unoptimizedPublicImage(src:string):boolean{
 return !src.startsWith('/')||src.startsWith('//');
}
