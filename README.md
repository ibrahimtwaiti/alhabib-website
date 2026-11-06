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
