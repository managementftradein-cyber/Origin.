# Programs page: flyers & graphics

The Programs page now shows each program as a flyer card (the whole flyer, never cropped), with the date,
place, description, and **View flyer / Share / Directions** buttons. Tapping a flyer opens it full-screen,
with arrows to flip between flyers. Share opens the phone's share sheet (WhatsApp etc.).

## One-time setup (do this once)
Supabase → **SQL Editor** → paste and run `supabase/programs_graphics_migration.sql`.
It adds the flyer/ordering fields and adds your three current flyers (TCC Worship Experience,
50 Days Bible Study, Weekly Services). It is safe to run again.

## Adding or changing a program (Admin)
1. Admin → **Programs & Events** → **+ New Program** (or **Edit** on an existing one).
2. **Upload flyer / image** — pick the picture from your phone or computer. Big images are shrunk
   automatically. (You can also paste an image link.)
3. Set the **Date & time**. For things that repeat or run for weeks, use **Date label**
   (e.g. `Every Sunday` or `10 Oct – 30 Nov 2026 · Mon–Fri 6pm`). Start with "Every" for weekly programs.
4. **Display order**: 1 shows first, then 2, 3…
5. Untick **Show on website** to hide a program without deleting it (e.g. after it has passed).
6. **Save Changes.** It appears on the Programs page immediately.

A program with no flyer still shows, as a simple dated row below the flyers.

## Good to know
- Flyers are stored in your existing Supabase `gallery` storage bucket but are **not** added to the website
  photo gallery or homepage slideshow.
- Times are shown in West Africa Time (Nigeria) for every visitor.
- "This Week / This Month" filters use the real dates; programs with a Date label always show.
- The Home page lists up to 4 programs under "Upcoming".
- If the one-time SQL above has not been run yet, the page still shows the three built-in flyers, and Admin
  will tell you to run the SQL when you try to save.
- Files: `index.html` (page), `admin/app.js` (upload form), `lib/api/content.js` + `api/content.js` and
  `lib/api/upload.js` + `api/upload.js` (kept identical), `assets/programs/` (the three flyers).
