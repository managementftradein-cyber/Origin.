# Welcome page

When a visitor opens the website, a full-screen **Welcome page** greets them: her photo on a TCC background
(emblem pattern, blue and red glow), "Welcome to the Christocentric Church platform" and "We love you ♥".

**To begin the website experience** the visitor taps **Close ✕** (top right) or **Enter the website**, or presses **Esc**.

## When it appears
- Once per browser every 24 hours (not on every page view or reload).
- Not on the Live / News / Community / Prophetic Room pages, and not when someone opens an app shortcut.
- Never on top of the launch-countdown screen.
- Add `?welcome=1` to the address (for example `yoursite.org/?welcome=1`) to show it any time, e.g. to test or share.
- Add `?welcome=0` to skip it.

## Changing it
- Words: edit the text inside `build()` in `tcc-welcome.js` (the `<h1>` and the "We love you" line).
- Photo: replace `assets/welcome/welcome-cutout.png`, `welcome-cutout.webp` and `welcome-cutout-sm.webp`
  (transparent background, 2:3 shape, edges that touch the right and bottom of the picture are hidden off-screen).
- How often it shows: Admin → Church Settings → Welcome Page ("Show again after … hours").

Shareable cards for WhatsApp / Instagram / Facebook (portrait 1080×1920, landscape 1920×1080) were made separately.
Files: `tcc-welcome.js`, `assets/welcome/`, `sw.js` (offline copy).

## Changing the photo and words from Admin (no code)
One-time: run `supabase/welcome_page_migration.sql` in Supabase → SQL Editor.
Then Admin → **Church Settings → Welcome Page**:
- tick / untick **Show the welcome page to visitors**
- **Photo**: press *Upload flyer / image*. A PNG or WEBP with a **transparent background** makes her appear to stand on the page;
  a normal photo is shown in a rounded frame (detected automatically)
- change the **headline**, the **second line** ("We love you") and the **button text** (empty = standard wording)
- **Show again after … hours** (default 24)
- **Save Welcome Page**, then **Preview** to see it on the website
The **About photo** (Hero & About page) can now be uploaded the same way.
