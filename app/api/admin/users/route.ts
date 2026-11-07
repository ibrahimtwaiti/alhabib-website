import {NextResponse} from 'next/server';
import {currentUser,publicUser,hashPassword,validateOrigin} from '@/lib/admin-auth';
import {readCms,mutateCms,newRow,type CmsUser} from '@/lib/cms-store';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';export const dynamic='force-dynamic';
const ACCESS=['specialists','specialties','availability','blog','achievements','settings','sections','media','departments'];
function guard(user:CmsUser|null){return user?.role==='super_admin'}
export async function GET(){const user=await currentUser();if(!guard(user))return NextResponse.json({error:'غير مصرح'},{status:403});const {store}=await readCms();return NextResponse.json({users:store.users.map(publicUser)},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){const user=await currentUser();if(!guard(user)||!await validateOrigin(req))return NextResponse.json({error:'غير مصرح'},{status:403});try{
 const body=await req.json();const username=String(body.username||'').trim().toLowerCase();const password=String(body.password||'');
 if(!/^[a-z][a-z0-9_.-]{2,39}$/.test(username)||password.length<12||password.length>128)return NextResponse.json({error:'اسم المستخدم يجب أن يكون إنجليزياً وكلمة المرور 12 حرفاً على الأقل'},{status:400});
 const permissions=Object.fromEntries(ACCESS.map(k=>[k,body.permissions?.[k]===true]));
 await mutateCms(store=>{if(store.users.some(u=>u.username===username))throw Error('EXISTS');store.users.push({id:randomUUID(),username,full_name:String(body.full_name||'مدير فرعي').slice(0,100),password_hash:hashPassword(password),role:'admin',permissions,is_active:true,session_version:1,created_at:new Date().toISOString()});
 (store.tables.activity_logs ||= []).unshift(newRow({actor_id:user!.id,actor_username:user!.username,table_name:'admin_users',operation:'create',affected_count:1}));});return NextResponse.json({ok:true});
 }catch(err){return NextResponse.json({error:String(err).includes('EXISTS')?'اسم المستخدم مستخدم بالفعل':'تعذر إنشاء الحساب'},{status:400})}}
export async function PATCH(req:Request){const viewer=await currentUser();if(!guard(viewer)||!await validateOrigin(req))return NextResponse.json({error:'غير مصرح'},{status:403});try{
 const b=await req.json();if(b.id===viewer?.id)return NextResponse.json({error:'لا يمكن تعطيل حساب المدير الرئيسي'},{status:403});
 await mutateCms(store=>{const user=store.users.find(u=>u.id===b.id&&u.role==='admin');if(!user)throw Error('NOT_FOUND');if(typeof b.full_name==='string')user.full_name=b.full_name.slice(0,100);if(typeof b.is_active==='boolean')user.is_active=b.is_active;if(b.permissions)user.permissions=Object.fromEntries(ACCESS.map(k=>[k,b.permissions[k]===true]));if(typeof b.password==='string'&&b.password.length){if(b.password.length<12||b.password.length>128)throw Error('PASSWORD');user.password_hash=hashPassword(b.password);user.session_version++}if(!user.is_active)user.session_version++;
 (store.tables.activity_logs ||= []).unshift(newRow({actor_id:viewer!.id,actor_username:viewer!.username,table_name:'admin_users',operation:'update',affected_count:1}));});return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'تعذر تعديل الحساب؛ كلمة المرور يجب أن تكون 12 حرفاً على الأقل'},{status:400})}}
