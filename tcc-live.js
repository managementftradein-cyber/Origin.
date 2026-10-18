/* ==========================================================================
   TCC Live \u2014 turns any pasted link into a player that plays INSIDE the page.

   Supported: YouTube (watch / live / shorts / youtu.be / embed / playlist /
   channel-id live), Facebook (videos, watch, reels, fb.watch, live), Vimeo
   (videos + live events), Twitch (channels + videos), direct .mp4/.webm/.m3u8
   files, and pasted <iframe> embed code.

   Used by: /live.html (public player) and /admin (link detection + preview).
   ========================================================================== */
(function (root) {
  'use strict';

  var YT_ID = /^[\w-]{11}$/;
  var YT_CHANNEL = /^UC[\w-]{22}$/;

  /* ---------- 1. clean up whatever the admin pasted ---------- */
  function cleanInput(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    // pasted <iframe ... src="..."> embed code \u2192 take the src
    var m = s.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
    if (m) s = m[1];
    s = s.replace(/&amp;/g, '&');
    if (s.indexOf('//') === 0) s = 'https:' + s;
    // "youtube.com/watch?v=..." with no scheme
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && /^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(s)) s = 'https://' + s;
    return s;
  }

  function parseUrl(s) {
    try {
      var u = new URL(s);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null; // blocks javascript:, data: etc.
      return u;
    } catch (e) { return null; }
  }

  function pathParts(u) { return u.pathname.split('/').filter(Boolean); }

  /* ---------- 2. recognise the platform ---------- */
  function resolve(raw, opts) {
    opts = opts || {};
    var s = cleanInput(raw);
    if (!s) return null;
    var u = parseUrl(s);
    if (!u) return { provider: 'Unknown', kind: 'invalid', note: 'That is not a valid web link.', watch: '', key: 'invalid:' + s };

    var host = u.hostname.toLowerCase().replace(/^(www|m|web|mbasic|touch|music)\./, '');
    var p = pathParts(u);
    var original = u.href;

    /* ----- YouTube ----- */
    if (host === 'youtu.be' || /(^|\.)youtube(-nocookie)?\.com$/.test(host)) {
      var id = null, list = u.searchParams.get('list'), channel = null;
      if (host === 'youtu.be') id = p[0];
      else if (p[0] === 'watch') id = u.searchParams.get('v');
      else if (p[0] === 'live' || p[0] === 'shorts' || p[0] === 'v') id = p[1];
      else if (p[0] === 'embed') {
        if (p[1] === 'live_stream') channel = u.searchParams.get('channel');
        else if (p[1] === 'videoseries') id = null;
        else id = p[1];
      }
      else if (p[0] === 'channel') channel = p[1];
      else if (p[0] === 'playlist') id = null;

      if (id && YT_ID.test(id)) {
        var q = 'autoplay=1&rel=0&playsinline=1&modestbranding=1' + (list ? '&list=' + encodeURIComponent(list) : '');
        var start = parseInt(u.searchParams.get('t') || u.searchParams.get('start') || '', 10);
        if (start > 0) q += '&start=' + start;
        return {
          provider: 'YouTube', kind: 'iframe', key: 'yt:' + id + (list || ''),
          src: 'https://www.youtube-nocookie.com/embed/' + id + '?' + q,
          thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
          watch: 'https://www.youtube.com/watch?v=' + id
        };
      }
      if (channel && YT_CHANNEL.test(channel)) {
        return {
          provider: 'YouTube', kind: 'iframe', key: 'ytc:' + channel,
          src: 'https://www.youtube-nocookie.com/embed/live_stream?channel=' + channel + '&autoplay=1&rel=0&playsinline=1',
          thumb: '', watch: 'https://www.youtube.com/channel/' + channel + '/live'
        };
      }
      if (list && (p[0] === 'playlist' || p[1] === 'videoseries' || p[0] === 'watch')) {
        return {
          provider: 'YouTube', kind: 'iframe', key: 'ytl:' + list,
          src: 'https://www.youtube-nocookie.com/embed/videoseries?list=' + encodeURIComponent(list) + '&autoplay=1&rel=0&playsinline=1',
          thumb: '', watch: original
        };
      }
      return {
        provider: 'YouTube', kind: 'link', key: 'link:' + original, watch: original, thumb: '',
        note: 'This YouTube link points to a channel name or page, which cannot be played inside the website. ' +
              'Paste the link of the live video itself (youtube.com/watch?v=\u2026 or youtube.com/live/\u2026), ' +
              'or use your channel\u2019s ID link (youtube.com/channel/UC\u2026/live).'
      };
    }

    /* ----- Facebook ----- */
    if (host === 'fb.watch' || host === 'fb.com' || /(^|\.)facebook\.com$/.test(host)) {
      var isVideo = host === 'fb.watch' ||
        /\/(videos?|reel|reels|watch|share\/[vr]|live)(\/|$)/.test(u.pathname) || u.searchParams.has('v');
      if (isVideo) {
        return {
          provider: 'Facebook', kind: 'iframe', key: 'fb:' + original,
          src: 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(original) +
               '&show_text=false&autoplay=true&allowfullscreen=true&width=1280',
          thumb: '', watch: original
        };
      }
      return {
        provider: 'Facebook', kind: 'link', key: 'link:' + original, watch: original, thumb: '',
        note: 'This Facebook link is a page, not a specific video. Open your live video on Facebook, ' +
              'copy its link (it contains /videos/ or /watch/), and paste that instead.'
      };
    }

    /* ----- Vimeo ----- */
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      if (p[0] === 'event' && /^\d+$/.test(p[1] || '')) {
        return { provider: 'Vimeo', kind: 'iframe', key: 'vmev:' + p[1],
          src: 'https://vimeo.com/event/' + p[1] + '/embed', thumb: '', watch: original };
      }
      var vid = null;
      for (var i = 0; i < p.length; i++) if (/^\d{6,}$/.test(p[i])) { vid = p[i]; break; }
      if (vid) {
        var hash = u.searchParams.get('h') || (p[p.indexOf(vid) + 1] && /^[a-f0-9]{8,}$/i.test(p[p.indexOf(vid) + 1]) ? p[p.indexOf(vid) + 1] : '');
        return { provider: 'Vimeo', kind: 'iframe', key: 'vm:' + vid,
          src: 'https://player.vimeo.com/video/' + vid + '?autoplay=1&playsinline=1' + (hash ? '&h=' + hash : ''),
          thumb: '', watch: original };
      }
    }

    /* ----- Twitch ----- */
    if (host === 'twitch.tv' || host === 'player.twitch.tv') {
      var parent = (root.location && root.location.hostname) || '';
      if (parent) {
        if (p[0] === 'videos' && /^\d+$/.test(p[1] || '')) {
          return { provider: 'Twitch', kind: 'iframe', key: 'tv:' + p[1],
            src: 'https://player.twitch.tv/?video=v' + p[1] + '&parent=' + encodeURIComponent(parent) + '&autoplay=true',
            thumb: '', watch: original };
        }
        var chan = host === 'player.twitch.tv' ? u.searchParams.get('channel') : p[0];
        if (chan && /^\w{3,25}$/.test(chan) && ['videos', 'directory', 'downloads'].indexOf(chan) < 0) {
          return { provider: 'Twitch', kind: 'iframe', key: 'tc:' + chan,
            src: 'https://player.twitch.tv/?channel=' + chan + '&parent=' + encodeURIComponent(parent) + '&autoplay=true',
            thumb: '', watch: original };
        }
      }
    }

    /* ----- direct video files ----- */
    if (/\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(u.pathname)) {
      return { provider: 'Video', kind: 'video', key: 'file:' + original, src: original, thumb: '', watch: original };
    }
    if (/\.m3u8$/i.test(u.pathname)) {
      return { provider: 'Live stream', kind: 'video', hls: true, key: 'hls:' + original, src: original, thumb: '', watch: original };
    }

    /* ----- anything else ----- */
    if (opts.trustEmbed && u.protocol === 'https:') {
      // the admin typed this into the "Embed URL" box on purpose \u2014 use it as the player as-is
      return { provider: u.hostname.replace(/^www\./, ''), kind: 'iframe', key: 'raw:' + original, src: original, thumb: '', watch: original };
    }
    return {
      provider: u.hostname.replace(/^www\./, ''), kind: 'link', key: 'link:' + original, watch: original, thumb: '',
      note: 'This site can\u2019t be recognised as a video player. Visitors will get a button that opens it in a new tab. ' +
            'If the platform gives you an embed link, paste it into the Embed URL box instead.'
    };
  }

  /* embed box wins (admin chose it deliberately), then the main link */
  function pick(status) {
    status = status || {};
    var a = resolve(status.embed_url, { trustEmbed: true });
    if (a && a.kind !== 'invalid') return a;
    var b = resolve(status.stream_url);
    if (b && b.kind !== 'invalid') return b;
    return null;
  }

  var api = { resolve: resolve, pick: pick, cleanInput: cleanInput };

  /* everything below needs a browser */
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.TCCLive = api;
    return;
  }

  /* ---------- 3. styles (injected once) ---------- */
  var CSS = '' +
  '.tcc-player.tcc-live-stage{display:block;overflow:hidden;background:#000}' +
  '.tcc-live-stage iframe,.tcc-live-stage video{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}' +
  '.tcc-live-poster{position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;margin:0;cursor:pointer;color:#fff;font:inherit;text-align:left;' +
    'background:radial-gradient(ellipse 80% 90% at 50% 0,rgba(var(--tcc-red-rgb,21,94,239),.4),transparent 65%),radial-gradient(ellipse 70% 80% at 100% 110%,rgba(var(--crimson-rgb,193,18,31),.35),transparent 65%),linear-gradient(165deg,#0d1838,#0a1024 55%,#16090f);overflow:hidden}' +
  '.tcc-live-poster:focus-visible{outline:3px solid #7AA7FF;outline-offset:-3px}' +
  '.tcc-live-thumb{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;transition:transform .6s ease,opacity .4s}' +
  '.tcc-live-poster:hover .tcc-live-thumb{transform:scale(1.04);opacity:.7}' +
  '.tcc-live-mark{position:absolute;left:50%;top:50%;width:min(300px,56%);aspect-ratio:846/727;transform:translate(-50%,-52%);background:url(/assets/logo-emblem.png) center/contain no-repeat;opacity:.17;' +
    'filter:drop-shadow(0 22px 34px rgba(0,0,0,.75)) drop-shadow(0 0 50px rgba(var(--tcc-red-rgb,21,94,239),.4))}' +
  '.tcc-live-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 30%,transparent 55%,rgba(0,0,0,.85))}' +
  '.tcc-live-play{position:absolute;left:50%;top:50%;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:var(--crimson,#C1121F);display:grid;place-items:center;' +
    'box-shadow:0 14px 40px rgba(0,0,0,.55),0 0 0 8px rgba(255,255,255,.12);transition:transform .25s ease,background .25s}' +
  '.tcc-live-play:before{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(var(--tcc-red-rgb,21,94,239),.9);animation:tccLivePulse 2.2s ease-out infinite}' +
  '.tcc-live-poster:hover .tcc-live-play{transform:scale(1.09);background:#d9172a}' +
  '.tcc-live-play svg{width:34px;height:34px;margin-left:5px;fill:#fff}' +
  '@keyframes tccLivePulse{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.55);opacity:0}}' +
  '.tcc-live-caption{position:absolute;left:0;right:0;bottom:0;padding:22px 24px;display:flex;flex-direction:column;gap:5px}' +
  '.tcc-live-caption b{font:600 clamp(17px,2.4vw,26px)/1.2 Georgia,serif}' +
  '.tcc-live-caption span{font:600 11px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#cdd8f5}' +
  '.tcc-live-chip{position:absolute;top:16px;right:16px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.2);padding:6px 11px;font:700 10px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#fff;backdrop-filter:blur(6px)}' +
  '.tcc-player .tcc-live-badge{z-index:3;display:flex;align-items:center;gap:8px}' +
  '.tcc-player .tcc-live-badge.on:before{content:"";width:8px;height:8px;border-radius:50%;background:#fff;animation:tccLiveBlink 1.1s infinite}' +
  '.tcc-player .tcc-live-badge.off{background:#162a5c}' +
  '@keyframes tccLiveBlink{50%{opacity:.25}}' +
  '.tcc-live-open{display:inline-flex;align-items:center;gap:8px;margin-top:18px;padding:11px 16px;border:1px solid rgba(255,255,255,.22);color:#fff;font:700 11px Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;transition:background .2s,border-color .2s}' +
  '.tcc-live-open:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.45)}' +
  '.tcc-live-notice{margin-top:16px;padding:12px 14px;background:rgba(var(--tcc-red-rgb,21,94,239),.14);border:1px solid rgba(var(--tcc-red-rgb,21,94,239),.45);font:500 13px/1.5 Inter,sans-serif;color:#dce8ff}' +
  '.tcc-live-notice button{margin-left:8px;padding:6px 11px;border:0;background:var(--crimson,#C1121F);color:#fff;font:700 11px Inter,sans-serif;letter-spacing:.08em;cursor:pointer}' +
  '.tcc-live-linknote{position:absolute;left:24px;right:24px;top:56px;font:500 12px/1.5 Inter,sans-serif;color:#cdd8f5;text-align:center}' +
  '@media (max-width:640px){.tcc-live-play{width:72px;height:72px;margin:-36px 0 0 -36px}.tcc-live-play svg{width:27px;height:27px}.tcc-live-caption{padding:14px 16px}}' +
  '@media (prefers-reduced-motion:reduce){.tcc-live-play:before,.tcc-live-badge.on:before{animation:none}.tcc-live-thumb{transition:none}}';

  function injectCss() {
    if (document.getElementById('tcc-live-style')) return;
    var st = document.createElement('style'); st.id = 'tcc-live-style'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  /* ---------- 4. the player ---------- */
  function startPlayback(box, res, opts, badge) {
    // remove the poster, keep the badge on top
    Array.prototype.slice.call(box.children).forEach(function (c) { if (c !== badge) box.removeChild(c); });
    if (res.kind === 'video') {
      if (res.hls && !document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
        box.appendChild(linkFallback(res, 'This browser cannot play this live stream directly.'));
        return;
      }
      var v = document.createElement('video');
      v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', '');
      v.src = res.src;
      box.appendChild(v);
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    } else {
      var f = document.createElement('iframe');
      f.src = res.src;
      f.title = (opts.title || 'TCC Live') + ' \u2014 ' + res.provider;
      f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.setAttribute('loading', 'eager');
      box.appendChild(f);
    }
    if (opts.onPlay) opts.onPlay(res);
  }

  function linkFallback(res, msg) {
    var wrap = el('div', 'tcc-live-poster');
    wrap.style.cursor = 'default';
    wrap.appendChild(el('div', 'tcc-live-mark'));
    wrap.appendChild(el('div', 'tcc-live-shade'));
    wrap.appendChild(el('div', 'tcc-live-linknote', msg));
    var a = el('a', 'tcc-live-open', 'Watch on ' + res.provider + ' \u2197');
    a.href = res.watch; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);margin:0;background:var(--crimson,#C1121F);border-color:transparent';
    wrap.appendChild(a);
    return wrap;
  }

  /* mount(el, res, {isLive, title, onPlay}) \u2014 draws the poster + play button */
  function mount(box, res, opts) {
    injectCss();
    opts = opts || {};
    box.textContent = '';
    box.classList.add('tcc-live-stage');
    if (!res || res.kind === 'invalid') {
      box.classList.remove('tcc-live-stage');
      box.appendChild(el('div', 'tcc-empty', 'Waiting for the next live program.'));
      return;
    }
    var badge = el('div', 'tcc-live-badge ' + (opts.isLive ? 'on' : 'off'), opts.isLive ? 'LIVE NOW' : 'LATEST BROADCAST');

    var poster = el('button', 'tcc-live-poster');
    poster.type = 'button';
    poster.setAttribute('aria-label', 'Play ' + (opts.title || 'the live broadcast'));
    poster.appendChild(el('div', 'tcc-live-mark'));
    if (res.thumb) {
      var img = document.createElement('img');
      img.className = 'tcc-live-thumb'; img.alt = ''; img.decoding = 'async';
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      img.src = res.thumb;
      poster.appendChild(img);
    }
    poster.appendChild(el('div', 'tcc-live-shade'));
    poster.appendChild(el('div', 'tcc-live-chip', res.provider));
    var play = el('div', 'tcc-live-play'); play.innerHTML = PLAY_SVG; poster.appendChild(play);
    var cap = el('div', 'tcc-live-caption');
    cap.appendChild(el('b', '', opts.title || 'TCC Live'));
    cap.appendChild(el('span', '', res.kind === 'link' ? 'Opens on ' + res.provider : (opts.isLive ? 'Tap to watch live' : 'Tap to watch')));
    poster.appendChild(cap);

    poster.addEventListener('click', function () {
      if (res.kind === 'link') { window.open(res.watch, '_blank', 'noopener'); return; }
      startPlayback(box, res, opts, badge);
    });

    box.appendChild(poster);
    box.appendChild(badge);
  }

  /* ---------- 5. admin: detect the pasted link + preview ---------- */
  function attachAdmin() {
    var form = document.getElementById('liveForm');
    if (!form || form.getAttribute('data-tcc-live')) return;
    form.setAttribute('data-tcc-live', '1');
    injectCss();
    var stream = form.elements.stream_url, embed = form.elements.embed_url;
    if (!stream) return;

    var note = el('div', 'notice'); note.id = 'liveDetect'; note.style.margin = '4px 0 12px';
    var prevBtn = el('button', 'btn', 'Preview player'); prevBtn.type = 'button'; prevBtn.style.marginTop = '10px';
    var prev = el('div', 'tcc-player'); prev.style.cssText = 'margin-top:12px;max-width:520px;display:none;position:relative;aspect-ratio:16/9;background:#000;border:1px solid rgba(255,255,255,.18)';
    var host = (embed && embed.closest('.field')) || stream.closest('.field');
    host.parentNode.insertBefore(note, host.nextSibling);
    note.parentNode.insertBefore(prev, note.nextSibling);

    function current() { return pick({ stream_url: stream.value, embed_url: embed ? embed.value : '' }); }

    var lastKey = null;
    function refresh() {
      var r = current();
      var k = r ? r.key : '';
      /* only close the preview when the link really changed (a blur/change event
         fires when the admin clicks Preview, and must not collapse it again) */
      if (k !== lastKey) {
        prev.style.display = 'none'; prev.textContent = ''; lastKey = k;
      }
      prevBtn.textContent = prev.style.display === 'none' ? 'Preview player' : 'Close preview';
      note.textContent = '';
      if (!r) { note.textContent = 'Paste a YouTube, Facebook, Vimeo or Twitch link above. It will play inside the Live page.'; return; }
      var line = el('div');
      if (r.kind === 'iframe' || r.kind === 'video') {
        line.textContent = '\u2713 Detected ' + r.provider + ' \u2014 this will play inside the Live page when visitors press Play.';
        note.appendChild(line); note.appendChild(prevBtn);
      } else {
        line.textContent = '\u26a0 ' + (r.note || 'This link can\u2019t be played inside the page.');
        note.appendChild(line);
      }
    }

    prevBtn.addEventListener('click', function () {
      var r = current(); if (!r) return;
      if (prev.style.display === 'none') {
        prev.style.display = 'block';
        mount(prev, r, { isLive: false, title: (form.elements.title && form.elements.title.value) || 'Preview' });
        prevBtn.textContent = 'Close preview';
      } else { prev.style.display = 'none'; prev.textContent = ''; prevBtn.textContent = 'Preview player'; }
    });

    ['input', 'change', 'paste'].forEach(function (ev) {
      stream.addEventListener(ev, function () { setTimeout(refresh, 0); });
      if (embed) embed.addEventListener(ev, function () { setTimeout(refresh, 0); });
    });
    api.refreshAdminPreview = refresh;
    refresh();
  }

  api.mount = mount;
  api.attachAdmin = attachAdmin;
  api.refreshAdminPreview = function () {};
  root.TCCLive = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachAdmin);
  else attachAdmin();
})(typeof window !== 'undefined' ? window : globalThis);
