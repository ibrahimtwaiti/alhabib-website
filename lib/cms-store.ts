import 'server-only';
import {get,put,head} from '@vercel/blob';
import {randomUUID} from 'node:crypto';

export type CmsUser={id:string;username:string;full_name:string;password_hash:string;role:'super_admin'|'admin';permissions:Record<string,boolean>;is_active:boolean;session_version:number;failed_attempts?:number;locked_until?:number;created_at:string};
export type CmsStore={users:CmsUser[];tables:Record<string,Record<string,unknown>[]>;updated_at:string};
export const DATA_PATH='cms/private-state-v1.json';
export const TABLES=['specialists','specialties','specialist_specialties','blog_posts','achievements','site_settings','availability_settings','dynamic_sections','blog_categories','departments','activity_logs','content_revisions'] as const;
const initial=():CmsStore=>({users:[],tables:Object.fromEntries(TABLES.map(t=>[t,[]])),updated_at:new Date().toISOString()});
export function ensureBlob(){if(!process.env.BLOB_READ_WRITE_TOKEN)throw new Error('التخزين الخاص غير مُهيأ على الخادم.');}
/** Every Vercel preview is read-only until an isolated Neon branch URL is configured.
 * Branch-name checks were unsafe: a hotfix/PR preview could otherwise write to production. */
export function isV3Preview(){return process.env.VERCEL_ENV==='preview'}
export function cmsDatabaseUrl(){
 const primary=process.env.DATABASE_URL||process.env.POSTGRES_URL||'';
 const dedicatedProduction=process.env.VERCEL_ENV==='production'?process.env.ALHABIB_PRIMARY_DATABASE_URL���q�^