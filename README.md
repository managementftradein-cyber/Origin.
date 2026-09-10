# The Christocentric Church — v9

Clean Vercel + Supabase deployment package.

## Project structure
- `src/` — **editable source.** Every HTML page, and every frontend CSS/JS
  file, lives here in readable form. This is what you edit; nothing under
  `src/` is ever deployed directly.
- `public/` — **generated output.** Produced by `npm run build` (see below);
  wiped and rebuilt every time. Never hand-edit anything here — it's not
  committed to git and your changes would be silently overwritten on the
  next build.
- `scripts/build.js` — the build step. For each page it bundles that page's
  own CSS files into one minified stylesheet and its own JS files into one
  minified, name-mangled script, then rewrites the page's `<link>`/`<script>`
  tags to point at the bundle. Third-party tags (Google Fonts, the Supabase
  CDN script) are left untouched.
- `api/[...path].js` + `lib/api/*.js` — Vercel serverless API functions
  (a single catch-all function dispatching to per-resource modules, so the
  project stays under Vercel's per-function limits).
- `supabase/*.sql` — see `SUPABASE-REPAIR-ORDER.md` for the order these need
  to be run in.

## Vercel
Import the GitHub repository with the files at repository root.
Use:
- Framework Preset: Other
- Root Directory: `.`
- Build Command: `npm run build` (already set in `vercel.json` — Vercel
  should pick it up automatically)
- Output Directory: `public` (also set in `vercel.json`)
- Install Command: `npm install`

Vercel runs `npm run build` on every deploy, which regenerates `public/`
from `src/` — bundling, minifying and mangling the frontend CSS/JS so the
page someone would view-source or download from the live site is a single
obfuscated file per page rather than the readable source. **If you add a new
CSS or JS file under `src/`, register it in `scripts/build.js`'s `PAGES`
list** — files not listed there won't be picked up by the build.

This project ships with a `vercel.json` that is required — it rewrites clean
URLs like `/about`, `/contact` and `/give` to `index.html` (so the client-side
router can render them) and maps friendly API paths (e.g. `/api/events`) to
the consolidated handler functions under `lib/api/`.

### Working locally
```
npm install       # pulls in terser, clean-css, html-minifier-terser
npm run build     # generates public/ from src/
vercel dev        # or your usual local Vercel workflow, serving public/
```
Because `package.json` just gained new devDependencies and this was set up
without network access to regenerate it, **run `npm install` once and commit
the resulting `package-lock.json`** before your next deploy — otherwise
Vercel's `npm ci` step will fail on a lockfile that doesn't match.

## Environment variables
Set these in Vercel:
- SUPABASE_URL
- SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY)
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAILS

`ADMIN_EMAILS` must contain the exact Supabase Auth email(s) allowed to use `/admin/`.

## Supabase
Run `supabase/tcc_v8_safe_migration.sql` if you have not already run the equivalent v7 migration (news, prophetic room, live status, etc. — written with IF NOT EXISTS/safe upserts).

Then run `supabase/community_schema.sql` to add the Community platform tables
(`profiles`, `community_posts`, `community_comments`, `community_likes`) with
row-level security policies. This is also safe to run more than once.

## Community platform
`community.html` is a members' social feed. Accounts are created through one-time
invite links issued from **Admin → Community Roles**. Posts and comments are
public-read by default; each member can only edit or delete their own content.
Church staff can hide or delete any post/comment from **Admin → Community
Posts / Community Comments**. See `SUPABASE-REPAIR-ORDER.md` for the repair
and migration order.

## Integrated updates
- Admin Giving/Offering accounts are managed from the Admin dashboard and published to the public Give page.
- Community invite redemption is race-safe and one-time; rate limiting and honeypot protection are included.
- Live department/community video meetings are included; configure `DAILY_API_KEY` in Vercel and run `supabase/meetings_migration.sql`.
- Automated backup support and rate-limit storage migrations are included.
- See `SUPABASE-REPAIR-ORDER.md` and `SETUP_CHECKLIST.md` before deployment.
