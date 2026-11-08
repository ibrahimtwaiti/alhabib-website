import {NextResponse} from 'next/server';
import {currentUser,publicUser} from '@/lib/admin-auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){const user=await currentUser();return NextResponse.json({user:user?publicUser(user):null},{headers:{'Cache-Control':'no-store'}})}
