# Pastor's Library link (cyberbishop.org)

The link to your pastor's books, videos and songs appears in these places (all open cyberbishop.org in a new tab):

1. **Home page**: a "Pastor's Library" band with Books / Videos / Songs tiles, right after "Upcoming".
2. **TCC Hub** dropdown in the header (desktop) and the **mobile menu**.
3. **Footer** on the main site, under "Connect".
4. The **TCC Hub strip, menu bar and mobile "More" sheet** on Live, Community, TCC News and Prophetic Room.

It works as soon as you deploy, with no setup.

## Changing it from Admin (optional one-time setup)
Run `supabase/library_link_migration.sql` once in Supabase → SQL Editor. Then:
Admin → **Church Settings** → **Pastor's Library**:
- tick / untick **Show the Pastor's Library link** to show or hide it everywhere at once
- change the **link**, **heading**, **short description** and **button text**
- press **Save Library Link**

If you haven't run the SQL yet, the site simply uses the built-in text and cyberbishop.org.

Files: `tcc-library.js` (controls every spot), `index.html` (band, menu, footer),
`tcc-fx.css` (band styling), `admin/` (settings panel), `lib/api/content.js` + `api/content.js` (kept identical).
