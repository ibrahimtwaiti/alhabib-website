import {NextResponse} from 'next/server';import {clearSession,validateOrigin} from '@/lib/admin-auth';
export const runtime='nodejs';export async function POST(req:Request){if(!await validateOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});await clearSession();return NextResponse.json({ok:true})}
