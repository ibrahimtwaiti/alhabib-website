'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

function friendlyLoginError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. استخدم بيانات الحساب المسجل في Supabase، أو استعد كلمة المرور.';
  }
  if (/email not confirmed/i.test(message)) return 'يلزم تأكيد البريد الإلكتروني من رسالة Supabase أولاً.';
  if (/rate limit|too many requests/i.test(message)) return 'هناك محاولات كثيرة. حاول لاحقاً أو استخدم استعادة كلمة المرور.';
  if (/fetch failed|failed to fetch|network/i.test(message)) return 'تعذّر الاتصال بخادم تسجيل الدخول. تحقق من الإنترنت وإعدادات Supabase.';
  return message || 'تعذّر تسجيل الدخول. راجع إعدادات Supabase وحساب المدير.';
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();
  const configured = isSupabaseConfigured();

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || loading) return;
    setLoading(true); setError(''); setNotice('');
    try {
      const db = createClient();
      const { error: loginError } = await db.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) throw loginError;
      router.replace('/admin/dashboard');
    } catch (reason: unknown) {
      setError(friendlyLoginError(reason));
    } finally { setLoading(false); }
  }

  async function resetPassword() {
    if (!configured || !email.trim() || resetting) {
      setError('أدخل البريد الإلكتروني المسجل أولاً لاستعادة كلمة المرور.');
      return;
    }
    setResetting(true); setError(''); setNotice('');
    try {
      const db = createClient();
      const { error: resetError } = await db.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice('إذا كان البريد مسجلاً، فستصلك رسالة استعادة كلمة المرور. افحص البريد الوارد والرسائل غير المرغوبة.');
    } catch (reason: unknown) {
      setError(friendlyLoginError(reason));
    } finally { setResetting(false); }
  }

  return <main className="admin-login-layout min-h-screen grid lg:grid-cols-[.9fr_1.1fr]" dir="rtl">
    <aside className="admin-login-brand hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white">
      <div className="flex items-center gap-4">
        <Image src="/assets/alhabib-logo.webp" alt="شعار الحبيب" width={72} height={84} priority className="h-[84px] w-[72px] rounded-2xl bg-white p-2 object-contain" />
        <div><strong className="block text-2xl tracking-wide">ALHABIB</strong><small className="text-white/80">ADMINISTRATION PORTAL</small></div>
      </div>
      <div className="max-w-xl"><span className="admin-login-eyebrow">إدارة موثوقة وآمنة</span><h1 className="text-4xl xl:text-5xl leading-[1.55] font-extrabold mt-5">مركز الحبيب<br/>كل التفاصيل في مكان واحد</h1><p className="mt-6 text-lg leading-9 text-white/85">إدارة الفريق والتخصصات والصور والحجوزات المبدئية والمحتوى، بصلاحيات مخصصة لكل مسؤول.</p></div>
      <div className="flex items-center gap-3 text-white/85 text-sm"><ShieldCheck size={20}/>هذه البوابة مخصصة للموظفين المصرح لهم فقط.</div>
    </aside>
    <section className="flex items-center justify-center p-5 sm:p-10">
      <div className="admin-login-card w-full max-w-[540px]">
        <div className="flex justify-between items-center gap-3"><div className="admin-login-symbol"><LockKeyhole size={30}/></div><span className="admin-login-brandmark">ALHABIB <span>•</span> ADMIN</span></div>
        <h2 className="text-3xl md:text-4xl font-extrabold mt-8">تسجيل دخول الإدارة</h2>
        <p className="mt-3 text-[15px] leading-8 text-[#57585a]">سجّل ببريدك الإلكتروني وكلمة مرور حساب المدير المسجل في Supabase. لا توجد كلمة مرور عامة باسم admin.</p>
        {!configured && <div className="admin-setup-notice mt-6" role="alert">
          <strong className="block text-base">يلزم تفعيل الاتصال بقاعدة البيانات</strong>
          <p className="mt-2 text-sm leading-7">نسخة الموقع المعروضة لا تحتوي على إعدادات الاتصال بـ Supabase؛ لهذا لن تعمل أي كلمة مرور، بما فيها <code>admin</code>.</p>
          <p className="mt-2 text-sm leading-7">لتفعيل الدخول: اربط مشروع Supabase الخاص بالمركز ببيئة <b>Preview</b> في Vercel عبر <code>NEXT_PUBLIC_SUPABASE_URL</code> و <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> أو <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>، ثم أعد النشر. بعد ذلك أنشئ حساب المدير في Supabase وربطه بدور <code>super_admin</code>.</p>
          <Link href="https://github.com/ibrahimtwaiti/alhabib-website/blob/version-2/docs/ADMIN-ACCESS.md" target="_blank" rel="noopener noreferrer" className="inline-flex underline font-bold text-sm mt-3">دليل تفعيل حساب المدير</Link>
        </div>}
        <form onSubmit={signIn} className="mt-7 space-y-5">
          <div><label className="label" htmlFor="admin-email">البريد الإلكتروني</label><div className="relative"><Mail aria-hidden="true" size={18} className="absolute end-4 top-1/2 -translate-y-1/2 text-[#327f70]"/><input id="admin-email" type="email" autoComplete="username" dir="ltr" required className="field admin-login-input pe-11" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div></div>
          <div><label className="label" htmlFor="admin-password">كلمة المرور</label><div className="relative"><input id="admin-password" type={visible?'text':'password'} dir="ltr" autoComplete="current-password" required className="field admin-login-input !pe-12" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#57585a] hover:text-[#8d517a]" onClick={()=>setVisible(v=>!v)} aria-label={visible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          {error && <p className="text-sm text-red-700 leading-7" role="alert">{error}</p>}
          {notice && <p className="text-sm text-[#57585a] leading-7" role="status">{notice}</p>}
          <button type="submit" disabled={!configured||loading} className="button-primary w-full !min-h-[58px]"><KeyRound size={19}/>{loading?'جارٍ التحقق...':'تسجيل الدخول'}</button>
        </form>
        {configured && <button type="button" onClick={resetPassword} disabled={resetting} className="mt-5 w-full text-sm font-bold text-[#327f70] hover:underline disabled:opacity-60">{resetting?'جارٍ إرسال رابط الاستعادة...':'نسيت كلمة المرور؟'}</button>}
        <div className="mt-8 border-t border-[#dadada] pt-6 text-center"><Link href="/" className="text-sm font-bold text-[#57585a] hover:text-[#8d517a]">العودة إلى الموقع الرئيسي</Link></div>
        <p className="mt-5 text-xs text-center text-[#57585a]">لا توجد كلمة مرور افتراضية عامة؛ يستخدم كل مدير حسابه الخاص.</p>
      </div>
    </section>
  </main>;
}
