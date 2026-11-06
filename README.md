# ALHABIB Rehabilitation Center Website

A bilingual (Arabic/English) Next.js starter for the Alhabib Physical Therapy & Medical Rehabilitation Center.

## Included in this first implementation

- Responsive bilingual landing page with RTL/LTR switching.
- Appointment enquiry form that prepares a WhatsApp message and opens `wa.me` (no internal patient booking storage).
- Manual earliest-availability settings by department in the admin dashboard; the public form reads the latest active setting from Supabase.
- Separate admin sign-in page using Supabase Auth.
- Protected admin dashboard with role check (`super_admin` / `admin`) and a working initial specialty-create/list module.
- Supabase schema for departments, specialties, specialists, specialty relationships, manual availability, articles, categories, achievements, settings, dynamic sections, and audit logs.
- Row Level Security policies and a public media storage bucket.

Some dashboard sections are intentionally shown as module placeholders in this first scaffold. The specialist, blog, achievements, settings, dynamic-section and sub-admin management screens still need their full CRUD interfaces and final integration before production launch.

## Requirements

- Node.js 20 or later
- A Supabase project
- A domain and hosting account (Vercel is a suggested option)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project.
3. Open Supabase SQL Editor and run `supabase/schema.sql` once.
4. In Supabase Authentication, create your first admin user (email/password).
5. Copy that user's UUID and run the bootstrap statement at the bottom of `supabase/schema.sql`, replacing `AUTH_USER_UUID` and the name. Set the role to `super_admin`.
6. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLINIC_WHATSAPP` (international format, digits only, e.g. country code + mobile number)
7. Run locally:

   ```bash
   npm run dev
   ```

8. Open `http://localhost:3000` for the public site and `http://localhost:3000/admin/login` for the admin portal.

## Admin permissions

- `super_admin` has all permissions.
- `admin` receives explicitly assigned boolean keys in `profiles.permissions`, for example:

  ```json
  {
    "specialties": true,
    "specialists": true,
    "blog": true,
    "achievements": true,
    "availability": true,
    "settings": false,
    "sections": false,
    "media": true
  }
  ```

Create the first super-admin profile manually. Do not expose the Supabase service-role key in the browser. Sub-admin account provisioning should be implemented through a trusted server route or Supabase Edge Function using a server-only service-role secret.

## Important launch checklist

- Replace all placeholder copy and sample specialties with the clinic-approved content.
- Add the actual team profiles, credentials, experience, specialties and department assignment.
- Configure the clinic WhatsApp number.
- Enter approved earliest-availability text for each applicable department/specialty/specialist.
- Upload the official logo and approved clinic photographs.
- Complete the remaining CRUD screens and role/permission management.
- Review privacy notice, consent language, data retention and Saudi PDPL compliance with the clinic's responsible privacy/legal owner.
- Configure backups, domain, production environment variables, monitoring and deployment access under the clinic's ownership.

## Notes about WhatsApp enquiries

The browser constructs the message locally and opens WhatsApp. The site does not save the form or claim that an appointment has been booked. A staff member must confirm availability with the visitor in WhatsApp. Do not include sensitive medical records or attachments in the URL-based message.
