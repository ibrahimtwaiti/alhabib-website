import 'server-only';
import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {readCms,type CmsUser} from './cms-store';

const COOKIE='alhabib_admin_session';
const SESSION_TIME=60*60*10;
export function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`}
export function verifyPassword(password:string,hash:string){try{const [salt,check]=hash.split(':');const expected=Buffer.from(check,'hex');const actual=scryptSync(password,salt,expected.length);return expected.length===actual.length&&timingSafeEqual(expected,actual)}catch{return false}}
export function safeSame(a:string,b:string){const h=(s:string)=>createHmac('sha256',process.env.AUTH_SECRET||'unconfigured').update(s).digest();return timingSafeEqual(h(a),h(b))}
function secret(){const key=process.env.AUTH_SECRET;if(!key||key.length<32)throw new Error('مفتاح الجلسات AUTH_SECRET غير مُهيأ');return key}
function sign(text:string){return createHmac('sha256',secret()).update(text).digest('base64url')}
export async function setSession(user:CmsUser){const expiry=Math.floor(Date.now()/1000)+SESSION_TIME;const value=Buffer.from(JSON.stringify({id:user.id,version:user.session_version,expiry})).toString('base64url');(await cookies()).set(COOKIE,`${value}.${sign(value)}`,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:SESSION_TIME})}
export async function clearSession(){(await cookies()).delete(COOKIE)}
export async function currentUser():Promise<CmsUser|null>{try{
 const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;
 const [payload,signature]=token.split('.');if(!payload||!signature||!safeSame(sign(payload),signature))return null;
 const value=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as {id:string;version:number;expiry:number};
 if(value.expiry<Math.floor(Date.now()/1000))return null;
 const {store}=await readCms();return store.users.find(u=>u.id===value.id&&u.session_version===value.version&&u.is_active)||null;
 }catch{return null}}
export function hasAccess(user:CmsUser|null,key:string){return !!user&&(user.role==='super_admin'||user.permissions?.[key]===true)}
export function publicUser(user:CmsUser){return {id:user.id,username:user.username,full_name:user.full_name,role:user.role,permissions:user.permissions,is_active:user.is_active,created_at:user.created_at}}
/** Unsafe requests require a same-origin initiator; missing Origin fails closed. */
export async function validateOrigin(request:Request):Promise<boolean>{
 const supplied=request.headers.get('origin');
 if(!supplied)return false;
 const fetchSite=request.headers.get('sec-fetch-site');
 if(fetchSite&&fetchSite!=='same-origin')return false;
 try{
  const requested=new URL(request.url);
  const origin=new URL(supplied);
  if(origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)return false;
  if(requested.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(requested.hostname))return false;
  return origin.origin===requested.origin;
 }catch{return false}
}
