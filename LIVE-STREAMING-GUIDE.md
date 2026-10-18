# Live page: how to go live

The Live page plays your broadcast **inside the website**. Visitors press the big Play button and the
YouTube / Facebook / Vimeo / Twitch player opens right there — they never leave the page.

## Going live (admin)
1. Admin → **Live Control**.
2. Paste the link of your live video into **Live link**. Examples that work:
   - YouTube: `youtube.com/watch?v=…`, `youtube.com/live/…`, `youtu.be/…`, `youtube.com/channel/UC…/live`
   - Facebook: `facebook.com/<page>/videos/…`, `facebook.com/watch/?v=…`, `fb.watch/…`, `facebook.com/reel/…`
   - Vimeo: `vimeo.com/123456789`, `vimeo.com/event/…`
   - Twitch: `twitch.tv/<channel>`
   - Direct files: `.mp4`, `.webm`, `.m3u8`
   - Or paste a platform's whole `<iframe …>` embed code — the link is pulled out automatically.
3. Check the green **Detected …** message and press **Preview player** to test it.
4. Tick **Broadcast is LIVE**, then **Save Live Settings**.

When the broadcast ends, untick LIVE. The link stays as a "Latest broadcast / replay" until you clear it.

## Good to know
- Use the link of the **specific live video**. Channel-name links (`youtube.com/@name/live`) and
  Facebook page links can't be embedded; the page then shows a button that opens them in a new tab,
  and Admin tells you so with a ⚠ message.
- The video must allow embedding (YouTube: Studio → Settings → Advanced → "Allow embedding").
  Facebook videos must be Public.
- Playback starts only after a tap/click on Play (browsers require this for sound).
- The page checks for changes every 30 seconds. It never reloads or interrupts someone who is watching;
  if you switch to a different link they see a "Switch now" notice instead.
- Optional **Embed URL** box: only for other platforms that give you a special embed link.

Files: `tcc-live.js` (link recognition + player, used by `live.html` and Admin), `live.html`, `admin/index.html`.
