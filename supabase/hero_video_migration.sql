-- Adds video support to the gallery/hero media library.
-- Safe to run more than once.

alter table gallery_photos add column if not exists media_type text default 'image';

-- Backfill any existing rows (all were images before this migration).
update gallery_photos set media_type = 'image' where media_type is null;

-- Guardrail so the column only ever holds one of the two supported kinds.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'gallery_photos_media_type_check'
  ) then
    alter table gallery_photos
      add constraint gallery_photos_media_type_check check (media_type in ('image', 'video'));
  end if;
end $$;
