# The TCC app (PWA)

The website can now be installed like an app on phones, tablets and computers.

## What visitors get
- **Install:** Android and desktop Chrome/Edge show an "Install the TCC app" card after ~20 seconds
  (and an "Install the app" link in the footer). iPhone/iPad show the same card with the steps:
  Share → **Add to Home Screen**. If someone taps ✕ the card stays away for 14 days.
- **App icon & full-screen window** with the TCC emblem. Long-press the icon (Android) for shortcuts:
  Watch Live, Programs & Events, Give, Community.
- **Works offline:** pages that were opened before, the Programs flyers and other saved content still open
  with no signal. A page that was never opened shows a friendly "You're offline" page.
- **Fast updates:** the app always checks the internet first, so new content appears right away.
  When a new version of the app files is ready, a "Refresh" bar appears.

## What is never saved offline (on purpose)
Admin and department-admin pages, logins, uploads, forms (contact, prayer, subscribe), the live broadcast status,
community posts and other websites (YouTube, Facebook, cyberbishop.org).

## After you deploy: quick check
1. Open the site in Chrome on your phone or computer (HTTPS is automatic on Vercel).
2. Chrome → DevTools → Application → Manifest: should show "The Christocentric Church" with no errors,
   and Service Workers: "activated".
3. Try Install. Then switch on airplane mode and open the app: Home, Programs and Live still open.

## Releasing a change to the app files later
Normal edits appear automatically. Only if you change `sw.js` rules, edit the line
`const VERSION = 'tcc-v1';` (for example to `tcc-v2`) so every phone cleans out its old saved copies.

## Files
`manifest.webmanifest` (name, colours, icons, shortcuts) · `sw.js` (offline + caching) · `offline.html` ·
`tcc-pwa.js` (install card + update bar) · `assets/pwa/` (icons, screenshots) · `vercel.json` (headers for sw.js and the manifest).
Every public page (Home, Live, Community, News, Prophetic Room) links the manifest and icons.
