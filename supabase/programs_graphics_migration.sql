-- ============================================================================
-- Programs page: flyers / graphics
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
-- Adds image + display fields to the existing `events` table (which powers the
-- Programs page) and seeds the three current TCC flyers.
-- ============================================================================

alter table public.events add column if not exists image_url     text;
alter table public.events add column if not exists date_label    text;                 -- optional text shown instead of the date, e.g. 'Every Sunday'
alter table public.events add column if not exists display_order integer default 0;    -- 1 = first on the page
alter table public.events add column if not exists is_published  boolean default true; -- untick in Admin to hide without deleting

-- Seed the three current programs (only if a program with that title isn't there yet).
-- Times are West Africa Time (WAT, UTC+1): 5pm WAT = 16:00 UTC, 6pm WAT = 17:00 UTC.
insert into public.events (title, date, location, description, image_url, date_label, display_order, is_published)
select * from (values
  ('TCC Worship Experience',
   '2026-10-25T16:00:00Z'::timestamptz,
   'Church Auditorium · BFB Plaza, Opp. Aklad Filling Station, Odo-ona Elewe, Ibadan',
   'An evening of worship with our ministers. For enquiries call +234 912 350 4269.',
   '/assets/programs/tcc-worship-experience.jpg',
   null::text, 1, true),
  ('50 Days Bible Study',
   '2026-10-10T17:00:00Z'::timestamptz,
   'Church Auditorium, Ibadan · and online (YouTube & Facebook: The Christocentric Church)',
   'Fifty days in the Word. Mon–Fri 6pm, Sat 7am. Join us at the church auditorium or online. Enquiries: +234 912 350 4269.',
   '/assets/programs/50-days-bible-study.jpg',
   '10 Oct – 30 Nov 2026 · Mon–Fri 6pm, Sat 7am', 2, true),
  ('Weekly Services',
   '2026-10-21T16:00:00Z'::timestamptz,
   'Church Auditorium, BFB Plaza, Odo-ona Elewe, Ibadan',
   'Wednesdays 5:00pm Bible Study. Sundays 8:00am Sunday School and 9:00am Word & Worship.',
   '/assets/programs/weekly-services.jpg',
   'Every Wednesday & Sunday', 3, true)
) as v(title, date, location, description, image_url, date_label, display_order, is_published)
where not exists (select 1 from public.events e where e.title = v.title);

-- If a program of the same title already existed (e.g. you added it by hand earlier), give it the flyer too:
update public.events e set image_url = '/assets/programs/tcc-worship-experience.jpg' where e.title = 'TCC Worship Experience' and e.image_url is null;
update public.events e set image_url = '/assets/programs/50-days-bible-study.jpg'    where e.title = '50 Days Bible Study'    and e.image_url is null;
update public.events e set image_url = '/assets/programs/weekly-services.jpg'        where e.title = 'Weekly Services'        and e.image_url is null;

create index if not exists events_display_order_idx on public.events (display_order, date);
