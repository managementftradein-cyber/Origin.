-- ============================================================================
-- Pastor's Library link (cyberbishop.org): editable from Admin -> Church Settings
-- Run once in Supabase -> SQL Editor. Safe to re-run.
-- The website already works with built-in defaults; this just lets you change/switch off the link in Admin.
-- ============================================================================
alter table public.church_settings add column if not exists library_enabled boolean default true;
alter table public.church_settings add column if not exists library_url     text    default 'https://cyberbishop.org';
alter table public.church_settings add column if not exists library_title   text    default 'Books, videos & songs by our pastor';
alter table public.church_settings add column if not exists library_text    text;
alter table public.church_settings add column if not exists library_button  text    default 'Visit the Library';

update public.church_settings
   set library_enabled = coalesce(library_enabled, true),
       library_url     = coalesce(nullif(library_url, ''), 'https://cyberbishop.org'),
       library_title   = coalesce(nullif(library_title, ''), 'Books, videos & songs by our pastor'),
       library_button  = coalesce(nullif(library_button, ''), 'Visit the Library')
 where id = 1;
