import { createBrowserClient } from '@supabase/ssr';

/** The browser uses only the public Supabase URL and publishable/anon key. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key || key.includes('YOUR_') || url.includes('YOUR_PROJECT')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch { return false; }
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('لم يتم ربط الموقع بـ Supabase بعد. يلزم ضبط إعدادات الاتصال في Vercel وإعادة نشر النسخة.');
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
  );
}
