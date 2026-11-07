'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

export default function ResetAdminPassword() {
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!isSupabaseConfigured())return;
    const db=createClient();
    // Supabase sends the password recovery session in the callback URL.
    let active=true;
    void db.auth.getSession().then(({data})=>{if(active)setReady(!!data.session)});
    const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
      if(active&&(event==='PASSWORD_RECOVERY'||event==='SIGNED_IN'||event==='INITIAL_SESSION'))setReady(!!session);
    });
    return ()=>{active=false;subscription.unsubscribe()};
  },[]);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');
    if(password.length<12){setError('استخدم كلمة مرور لا تقل عن 12 حرفاً.');return}
    if(password!==confirm){setError('كلمتا المرور غير متطابقتين.');return}
    setBusy(true);
    try{const db=createClient();const {error:problem}=await db.auth.updateUser({password});if(problem)throw problem;await db.auth.signOut();setDone(true)}
    catch(reason:unknown){setError(reason instanceof Error?reason.message:'تعذر تحديث كلمة المرور. اطلب رابط استعادة جديداً.')}
    finally{setBusy(false)}
  }
  return <main dir="rtl" className="admin-login-layout min-h-screen grid place-items-center p-5"><div className="admin-login-card max-w-lg w-full"><div className="admin-login-symbol"><ShieldCheck size={30}/></div><h1 className="text-3xl font-extrabold mt-6">تعيين كلمة مرور جديدة</h1>
  {done?<div role="status" className="mt-6"><CheckCircle2 className="text-[#8d517a]" size={36}/><p className="mt-3 leading-8">تم تغيير كلمة المرور بنجاح. سجّل دخولك بالبيانات الجديدة.</p><Link href="/admin/login" className="button-primary mt-6 w-full">العودة إلى تسجيل الدخول</Link></div>:<><p className="mt-3 text-sm leading-7">افتح هذه الصفحة من رابط الاستعادة الذي أرسله Supabase إلى بريدك.</p><form onSubmit={submit} className="space-y-4 mt-6"><label className="label" htmlFor="new-pass">كلمة المرور الجديدة (12 حرفاً على الأقل)</label><input id="new-pass" type="password" autoComplete="new-password" className="field" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)}/><label className="label" htmlFor="confirm-pass">تأكيد كلمة المرور</label><input id="confirm-pass" type="password" autoComplete="new-password" className="field" required minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)}/>{error&&<p role="alert" className="text-red-700 text-sm">{error}</p>}<button type="submit" disabled={!ready||busy} className="button-primary w-full"><KeyRound size={18}/>{busy?'جارٍ التحديث...':'حفظ كلمة المرور'}</button>{!ready&&<p className="text-sm text-[#57585a]">لم يتم التحقق من رابط الاستعادة بعد. افتح الرابط المرسل إلى بريدك مرة أخرى.</p>}</form></>}
  </div></main>;
}
