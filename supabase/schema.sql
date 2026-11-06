-- ALHABIB rehabilitation platform: initial schema and Row Level Security.
-- Run in Supabase SQL Editor after creating the project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'admin' check (role in ('super_admin','admin')),
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active and p.role in ('super_admin','admin')) $$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active and p.role = 'super_admin') $$;

create or replace function public.has_permission(permission_key text)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active and (p.role = 'super_admin' or coalesce((p.permissions ->> permission_key)::boolean,false))) $$;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique,
  description_ar text not null default '',
  description_en text not null default '',
  image_url text,
  department_scope text not null default 'both' check (department_scope in ('men','women','both')),
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specialists (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  title_ar text not null default '',
  title_en text not null default '',
  bio_ar text not null default '',
  bio_en text not null default '',
  qualifications jsonb not null default '[]'::jsonb,
  experience_years int,
  languages jsonb not null default '[]'::jsonb,
  department text not null check (department in ('men','women')),
  image_url text,
  conditions_ar jsonb not null default '[]'::jsonb,
  conditions_en jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specialist_specialties (
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  specialty_id uuid not null references public.specialties(id) on delete cascade,
  primary key (specialist_id,specialty_id)
);

-- Manually maintained availability text; no patient bookings are stored in v1.
create table if not exists public.availability_settings (
  id uuid primary key default gen_random_uuid(),
  department text not null check (department in ('men','women')),
  specialty_id uuid references public.specialties(id) on delete set null,
  specialist_id uuid references public.specialists(id) on delete cascade,
  label_ar text not null,
  label_en text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  excerpt_ar text not null default '',
  excerpt_en text not null default '',
  body_ar text not null default '',
  body_en text not null default '',
  cover_image_url text,
  author_specialist_id uuid references public.specialists(id) on delete set null,
  category_id uuid references public.blog_categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  published_at timestamptz,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text not null default '',
  description_en text not null default '',
  image_url text,
  specialist_id uuid references public.specialists(id) on delete set null,
  achieved_on date,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
create table if not exists public.dynamic_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title_ar text not null,
  title_en text not null,
  content_type text not null default 'cards',
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.specialties enable row level security;
alter table public.specialists enable row level security;
alter table public.specialist_specialties enable row level security;
alter table public.availability_settings enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.achievements enable row level security;
alter table public.site_settings enable row level security;
alter table public.dynamic_sections enable row level security;
alter table public.activity_logs enable row level security;

-- Profiles: a user can read their own profile; only the super admin manages roles.
create policy "profile self read" on public.profiles for select using (id = auth.uid() or public.is_super_admin());
create policy "super admin manage profiles" on public.profiles for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Public content is readable only when published/active. Mutations require module permissions.
create policy "departments public read" on public.departments for select using (is_active or public.is_active_admin());
create policy "departments manage" on public.departments for all using (public.has_permission('departments')) with check (public.has_permission('departments'));
create policy "specialties public read" on public.specialties for select using (is_published or public.is_active_admin());
create policy "specialties manage" on public.specialties for all using (public.has_permission('specialties')) with check (public.has_permission('specialties'));
create policy "specialists public read" on public.specialists for select using (is_published or public.is_active_admin());
create policy "specialists manage" on public.specialists for all using (public.has_permission('specialists')) with check (public.has_permission('specialists'));
create policy "specialist specialties read" on public.specialist_specialties for select using (true);
create policy "specialist specialties manage" on public.specialist_specialties for all using (public.has_permission('specialists')) with check (public.has_permission('specialists'));
create policy "availability public read" on public.availability_settings for select using (is_active or public.is_active_admin());
create policy "availability manage" on public.availability_settings for all using (public.has_permission('availability')) with check (public.has_permission('availability'));
create policy "blog categories read" on public.blog_categories for select using (true);
create policy "blog categories manage" on public.blog_categories for all using (public.has_permission('blog')) with check (public.has_permission('blog'));
create policy "published blog read" on public.blog_posts for select using (status = 'published' or public.is_active_admin());
create policy "blog manage" on public.blog_posts for all using (public.has_permission('blog')) with check (public.has_permission('blog'));
create policy "published achievements read" on public.achievements for select using (is_published or public.is_active_admin());
create policy "achievements manage" on public.achievements for all using (public.has_permission('achievements')) with check (public.has_permission('achievements'));
create policy "public settings read" on public.site_settings for select using (is_public or public.is_active_admin());
create policy "settings manage" on public.site_settings for all using (public.has_permission('settings')) with check (public.has_permission('settings'));
create policy "enabled sections read" on public.dynamic_sections for select using (is_enabled or public.is_active_admin());
create policy "sections manage" on public.dynamic_sections for all using (public.has_permission('sections')) with check (public.has_permission('sections'));
create policy "logs read super admin" on public.activity_logs for select using (public.is_super_admin());
create policy "logs insert admin" on public.activity_logs for insert with check (public.is_active_admin() and actor_id = auth.uid());

-- Storage bucket for public site media. Upload/delete policies are admin-only.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-media','site-media',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "public read site media" on storage.objects for select using (bucket_id = 'site-media');
create policy "admin upload site media" on storage.objects for insert with check (bucket_id = 'site-media' and public.has_permission('media'));
create policy "admin update site media" on storage.objects for update using (bucket_id = 'site-media' and public.has_permission('media')) with check (bucket_id = 'site-media' and public.has_permission('media'));
create policy "admin delete site media" on storage.objects for delete using (bucket_id = 'site-media' and public.has_permission('media'));

-- First-admin bootstrap (run manually after creating your first Auth user):
-- insert into public.profiles (id,full_name,role,permissions,is_active)
-- values ('AUTH_USER_UUID','اسم المدير الرئيسي','super_admin','{}'::jsonb,true);
-- Create sub-admin profiles from the super-admin portal after its user-management module is enabled.
