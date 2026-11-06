# ALHABIB Rehabilitation Center — V2 staging branch

A bilingual public website and Supabase-based administration scaffold for Alhabib Physical Therapy & Medical Rehabilitation Center.

## What's new in V2

- Updated official visual identity with the clinic-approved logo, plum `#8d517a`, gray `#57585a` and white `#ffffff`.
- Responsive, interactive home page, modern icon treatments, improved navigation, page layout and admin branding.
- Profiles of **10 clinic professionals**, including their approved-source photos, qualifications and clinical services transcribed from the 22-page PDF supplied by the clinic. Full professional lists remain in Arabic (their source language); English summaries/titles are provided. Review spelling, degrees, certifications, services and image authorization with clinic management before launch.
- New public routes: `/team`, `/team/[slug]`, `/specialties`, `/specialties/[slug]`, `/about`, `/booking`, `/contact`, `/achievements`, `/blog`, `/privacy`, `/terms`.
- Booking by WhatsApp only, default `966591009916` (`0591009916` locally). The checkbox consent gate has been removed, while a privacy notice and the fact that WhatsApp does not confirm bookings remain visible.
- Admin content modules: editable specialist, blog, achievement and WhatsApp setting entries backed by Supabase, protected by existing RLS. Published staff entries are loaded on public pages when Supabase is configured; the clinic-provided public professional profiles are bundled as a fallback. The full CMS for all site sections remains a further development step.
- Structured metadata, sitemap route, robots route, reduced-motion support and keyboard focus indicators.

## Local setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and configure the Supabase variables and site URL.
3. Create your Supabase project; run `supabase/schema.sql` in the Supabase SQL editor **if not already installed**. Do not reapply migrations blindly on production.
4. Run `npm run lint` (TypeScript checking) and `npm run build`, then `npm run dev` to review the staging site.
5. Before deployment, test RTL/LTR layouts, mobile navigation, all 10 specialist pages, department filtering, WhatsApp prefilled messages, admin login, RLS permissions, images and browser console. Verify the privacy notice and professional content with the clinic.

## Configuration

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: for public availability settings and admin.
- `NEXT_PUBLIC_SITE_URL`: deployed canonical origin, required for meaningful sitemap URLs.
- Booking form default number is in `lib/clinic-data.ts`; the admin settings entry can be enabled for remote configuration as a follow-up integration.

## Important notes

- The website **does not store enquiries**. Visitors fill in a form on their device, open a WhatsApp link with a prepared message and then explicitly send it in WhatsApp. Medical details in the message URL should be kept brief and non-sensitive.
- There are **no confirmed patient testimonials, medical articles or outcome metrics** in the provided materials. V2 intentionally does not fabricate them.
- All public assets under `public/assets/team` are cropped from the clinic-supplied PDF. No stock faces or fabricated staff portraits were used.
- Before merging this branch into `main`, complete a live Vercel preview build and validate Supabase production configuration and permissions. This branch is **not a production deployment**.

## V2.1 — إدارة الصور والأيقونات من حساب الأدمن

1. سجّل الدخول إلى `/admin/login` بحساب **Super Admin** أو أدمن لديه صلاحية `specialists` لتغيير صور الفريق، وصلاحية `settings` لتغيير صور التخصصات.
2. من لوحة التحكم اختر **الأخصائيون**، ثم اضغط **تعديل** أمام الأخصائي. في حقل **تغيير الصورة من جهازك** اختر صورة JPG/PNG/WebP/AVIF أقل من 5MB، واضغط **حفظ**. الصورة تُرفع إلى حاوية `site-media` في Supabase Storage، ويحفظ رابطها في `specialists.image_url`. بعد نشر السجل وتحديث الصفحة تظهر الصورة في بطاقات الفريق والملف المهني. يمكن أيضاً تعديل رابط الصورة مباشرة في الحقل المخصص. إن لم تختر صورة جديدة تُحفظ الصورة الحالية.
3. من **إعدادات الموقع**، قسم **الصور والأيقونات في الموقع**، اختر تخصصاً، ثم غيّر الأيقونة من القائمة أو ارفع صورة ذات صلة. الصورة لها أولوية العرض على الأيقونة؛ اضغط **إزالة الصورة والعودة للأيقونة** لإلغاء ذلك. يمكن تغيير صورة واجهة الرئيسية (Hero) من القسم نفسه.
4. اضغط **حفظ تغييرات الصور والأيقونات** بعد الرفع أو التعديل؛ تحفظ الاختيارات في `site_settings` تحت المفتاح `specialty_visuals` وتُقرأ في الموقع العام. يفضل تحديث الصفحة بعد الحفظ.
5. تحقق من تفعيل `supabase/schema.sql` وسياسات RLS والتخزين وصلاحيات `media` و`settings` و`specialists`. يحتاج الأدمن لصلاحية `media` لرفع الصور أيضاً.

**التاريخ:** نموذج الحجز يستخدم مدخل تاريخ قياسي باتجاه LTR، ويعرض التاريخ نصياً بصيغة اليوم ثم الشهر ثم السنة بالتقويم الميلادي، مع تنسيق الوقت بنظام 12 ساعة. قد يختلف شكل واجهة منتقي التاريخ الأصلية باختلاف المتصفح ونظام التشغيل، لكن العرض النهائي ورسالة واتساب ثابتان.

**واتساب:** نص الطلب منسّق بالنجوم والإيموجي، ويذكر صراحة أن الموعد مبدئي، دون تخزين معلومات المريض في قاعدة الموقع. يجب مراجعة سياسة الخصوصية وممارسات معالجة بيانات الصحة قبل الإطلاق.

**ملاحظة:** بيانات الفريق المرفقة في المصدر تعمل كبيانات عرض أولية. لتغيير الصورة من الأدمن يجب أن يوجد سجل منشور مطابق للاسم في جدول `specialists`؛ إن لم يوجد، أنشئ سجلاً بنفس الاسم ثم ارفع الصورة وانشره. لا تتم الكتابة تلقائياً إلى قاعدة Supabase الحية عند نشر كود GitHub.
