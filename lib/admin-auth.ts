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
export async function setSession(user:CmsUser){const expiry=Math.floor(Date.now()/1000)+SESSION_TIME;const value=Buffer.from(JSON.stringify({id:user.id,version:user.session_version,expiry})).toString('base64url');(await cookies()).set(COOKIE,`${value}.${sign(value)}`,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:SESS���q�^