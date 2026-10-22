-- ============================================================================
-- Automatic YouTube live detection: two new settings on the Live Control page.
-- Run once in Supabase -> SQL Editor. Safe to re-run.
-- ============================================================================
alter table public.live_status add column if not exists auto_enabled       boolean default false;
alter table public.live_status add column if not exists youtube_channel_id text;
