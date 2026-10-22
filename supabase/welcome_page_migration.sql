-- ============================================================================
-- Welcome page: editable from Admin -> Church Settings -> Welcome Page
-- Run once in Supabase -> SQL Editor. Safe to re-run.
-- The website already works with built-in defaults; this lets you change the photo, wording and on/off switch.
-- ============================================================================
alter table public.church_settings add column if not exists welcome_enabled    boolean default true;
alter table public.church_settings add column if not exists welcome_photo_url  text;
alter table public.church_settings add column if not exists welcome_photo_mode text default 'cutout';   -- 'cutout' (transparent) or 'photo' (normal picture)
alter table public.church_settings add column if not exists welcome_title      text;
alter table public.church_settings add column if not exists welcome_love       text;
alter table public.church_settings add column if not exists welcome_button     text;
alter table public.church_settings add column if not exists welcome_hours      integer default 24;

update public.church_settings
   set welcome_enabled = coalesce(welcome_enabled, true),
       welcome_photo_mode = coalesce(nullif(welcome_photo_mode, ''), 'cutout'),
       welcome_hours = coalesce(welcome_hours, 24)
 where id = 1;
