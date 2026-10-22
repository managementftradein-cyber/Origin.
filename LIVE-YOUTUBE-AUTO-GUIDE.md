# Go live on YouTube and the website switches itself on

When your YouTube channel starts a live stream, the website notices within about a minute:
- the **Live page** turns to "LIVE NOW" with a Play button (the player runs inside the page),
- a small **"LIVE NOW · Watch" pill** appears under the header on every other page,
- when the stream ends, the Live page automatically shows the **replay** (for 14 days).

You do not paste links or tick any box. (The manual method still works and always wins if you tick "Broadcast is LIVE".)

## One-time setup (about 10 minutes)
**1. Get a free YouTube API key**
1. Go to https://console.cloud.google.com and create a project (any name, e.g. "TCC website").
2. Menu → **APIs & Services → Library** → search **YouTube Data API v3** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → API key**. Copy it.
4. (Recommended) click the key → **API restrictions → Restrict key → YouTube Data API v3** → Save.

**2. Give the key to the website (Vercel)**
Vercel → your project → **Settings → Environment Variables** → add
`YOUTUBE_API_KEY` = the key → then **Redeploy** the project.

**3. Run one SQL file (Supabase → SQL Editor)**
`supabase/live_auto_youtube_migration.sql`

**4. Switch it on (Admin → Live Control)**
1. Tick **Automatically show my YouTube live on the website**.
2. Enter your channel as **@handle** (e.g. `@yourchurch`), a channel link, or the channel ID (starts with UC).
3. **Save Live Settings**, then press **Test YouTube connection**. You should see "Connected to <your channel>".
4. Leave "Broadcast is LIVE" **unticked** in automatic mode.

## Going live each time
Just start your live stream on YouTube as usual (phone, YouTube Studio or OBS). Make sure:
- the stream is **Public** (Unlisted and Private streams cannot be detected),
- **Allow embedding** is on (YouTube Studio → the stream → Customization / Settings). If it is off, the Live page still
  works, but visitors get a button that opens YouTube instead of an in-page player.

## Good to know
- Delay: usually under a minute (the site checks YouTube about every 30 to 60 seconds and shares one check between all visitors).
- Cost: free. Each check uses about 2 of YouTube's 10,000 free daily units, so there is lots of room.
- If YouTube is unreachable or the key stops working, the website simply keeps using the manual settings. It never breaks.
- Test connection tells you plainly what is wrong (bad key, API not enabled, wrong channel, daily allowance used).
- Facebook live streams are not auto-detected; use the manual link method for those.
- I could only test this against a simulated YouTube, so please do one real test: start a Public test stream (even for 2 minutes)
  and confirm the Live page switches within a minute or two.

Files: `lib/api/_youtube.js` + `api/_youtube.js`, `lib/api/live-status.js` + `api/live-status.js` (each pair kept identical),
`tcc-livebar.js`, `live.html`, `admin/` (Live Control), `supabase/live_auto_youtube_migration.sql`.
