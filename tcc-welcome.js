/* ==========================================================================
   Welcome page: a full-screen "Welcome to the Christocentric Church platform" greeting
   on a TCC background, with a Close button (and Esc) to begin the website.
   - Shown once per 24 hours per browser (not on every page view).
   - Never shown over the launch-countdown screen, nor on /?welcome=0 or app shortcuts.
   - To see it again any time: add ?welcome=1 to the address.
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'tcc_welcome_seen';
  var DEF = { title: 'Welcome to the Christocentric Church platform', love: 'We love you', button: 'Enter the website', hours: 24 };
  var qs = new URLSearchParams(location.search), forced = qs.get('welcome') === '1';
  if (qs.get('welcome') === '0' || qs.get('source') === 'shortcut') return;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var open = false, root = null, lastFocus = null, inerted = [], cfgPromise = null;

  /* settings from Admin -> Church Settings -> Welcome Page (falls back to the standard wording/photo) */
  function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (/^\/(?!\/)/.test(u)) return u; try { var x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; } }
  function loadCfg() {
    if (cfgPromise) return cfgPromise;
    cfgPromise = new Promise(function (resolve) {
      var done = false; function fin(c) { if (!done) { done = true; resolve(c || {}); } }
      setTimeout(function () { fin({}); }, 2200);
      fetch('/api/site-content', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { fin(d && d.settings); }).catch(function () { fin({}); });
    });
    return cfgPromise;
  }
  function normalize(s) {
    s = s || {}; var h = Number(s.welcome_hours);
    return { enabled: s.welcome_enabled !== false, hours: (h >= 1 && h <= 720) ? h : DEF.hours,
      title: String(s.welcome_title || '').trim() || DEF.title, love: String(s.welcome_love || '').trim() || DEF.love, button: String(s.welcome_button || '').trim() || DEF.button,
      photo: safeUrl(s.welcome_photo_url), mode: s.welcome_photo_mode === 'photo' ? 'photo' : 'cutout' };
  }
  function setHeadline(h1, text) {
    var key = 'Christocentric Church', i = text.toLowerCase().indexOf(key.toLowerCase()); h1.textContent = '';
    if (i < 0) { h1.textContent = text; return; }
    h1.appendChild(document.createTextNode(text.slice(0, i)));
    var em = document.createElement('em'); em.textContent = text.slice(i, i + key.length); h1.appendChild(em);
    h1.appendChild(document.createTextNode(text.slice(i + key.length)));
  }

  var CSS = '' +
  '.wlc{--fh:min(98dvh,78vw);--fw:calc(var(--fh)*2/3);--ew:min(94dvh,68vw);position:fixed;inset:0;z-index:100050;overflow:hidden;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif;' +
    'background:radial-gradient(ellipse 65% 60% at 10% 0,rgba(21,94,239,.62),transparent 62%),radial-gradient(ellipse 60% 55% at 100% 100%,rgba(193,18,31,.52),transparent 62%),linear-gradient(160deg,#0d1838 0%,#0a1024 52%,#16090f 100%);animation:wlcIn .5s ease both}' +
  '.wlc.out{opacity:0;transition:opacity .45s ease;pointer-events:none}' +
  '.wlc-pattern{position:absolute;inset:0;background:url(/assets/welcome/tcc-pattern.png) 0 0/260px auto repeat;opacity:.08;-webkit-mask-image:radial-gradient(ellipse 85% 75% at 50% 45%,#000 30%,transparent 100%);mask-image:radial-gradient(ellipse 85% 75% at 50% 45%,#000 30%,transparent 100%)}' +
  '.wlc-emblem{position:absolute;width:var(--ew);aspect-ratio:846/727;right:calc(var(--fw)/2 - var(--ew)/2);bottom:calc(var(--fh)*.14);background:url(/assets/logo-emblem.png) center/contain no-repeat;opacity:.17;filter:drop-shadow(0 30px 60px rgba(0,0,0,.7));animation:wlcEmblem 1.6s .1s cubic-bezier(.22,1,.36,1) both}' +
  '.wlc-halo{position:absolute;width:calc(var(--fh)*.95);height:calc(var(--fh)*.95);right:calc(var(--fw)/2 - var(--fh)*.475);bottom:calc(var(--fh)*.2);border-radius:50%;background:radial-gradient(circle,rgba(122,167,255,.42),rgba(21,94,239,.12) 45%,transparent 70%);filter:blur(6px)}' +
  '.wlc-figwrap{position:absolute;right:0;bottom:0;height:var(--fh);width:var(--fw)}' +
  '.wlc-figwrap img{display:block;width:100%;height:100%;object-fit:contain;object-position:bottom right;filter:drop-shadow(0 26px 40px rgba(0,0,0,.55));animation:wlcRise 1s .2s cubic-bezier(.22,1,.36,1) both}' +
  '.wlc-fade{display:none}' +
  '.wlc-main{position:absolute;left:clamp(28px,7vw,120px);top:50%;transform:translateY(-50%);width:max(300px,min(640px,calc(100vw - var(--fw) - clamp(28px,7vw,120px) - 28px)))}' +
  '.wlc-brand{display:flex;align-items:center;gap:16px;font:700 13px Inter,system-ui,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#9dbbff;animation:wlcSlide .8s .35s cubic-bezier(.22,1,.36,1) both}' +
  '.wlc-brand img{width:54px;height:auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.6))}' +
  '.wlc h1{font:700 clamp(36px,5.2vw,80px)/1.06 "Playfair Display",Lora,Georgia,serif;letter-spacing:-.01em;margin:26px 0 0;animation:wlcSlide .9s .5s cubic-bezier(.22,1,.36,1) both}' +
  '.wlc h1 em{font-style:normal;color:#7AA7FF}' +
  '.wlc-love{display:flex;align-items:center;gap:.26em;white-space:nowrap;margin-top:clamp(22px,4vh,46px);font:italic 600 clamp(54px,7.4vw,116px)/1 "Playfair Display",Lora,Georgia,serif;text-shadow:0 6px 30px rgba(0,0,0,.65);animation:wlcSlide .9s .75s cubic-bezier(.22,1,.36,1) both}' +
  '.wlc-love svg{width:.74em;height:.74em;flex:none;filter:drop-shadow(0 8px 18px rgba(193,18,31,.7));animation:wlcBeat 2.4s 1.6s ease-in-out infinite}' +
  '.wlc-go{display:inline-flex;align-items:center;gap:12px;margin-top:clamp(26px,5vh,52px);min-height:56px;padding:0 34px;border:0;background:#C1121F;color:#fff;font:800 13px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;box-shadow:0 16px 40px -14px rgba(193,18,31,.9);transition:transform .2s ease,background .2s ease;animation:wlcSlide .9s 1s cubic-bezier(.22,1,.36,1) both}' +
  '.wlc-go:hover{background:#d9172a;transform:translateY(-2px)}' +
  '.wlc-hint{margin-top:16px;font:500 12px Inter,system-ui,sans-serif;color:#8fa3d6;letter-spacing:.04em;animation:wlcSlide .9s 1.15s both}' +
  '.wlc-close{position:absolute;z-index:5;top:calc(env(safe-area-inset-top,0px) + 18px);right:18px;display:inline-flex;align-items:center;gap:10px;min-height:46px;padding:0 18px 0 20px;color:#fff;cursor:pointer;font:700 12px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;' +
    'background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.05)),rgba(10,17,40,.55);border:1px solid rgba(255,255,255,.3);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.22);animation:wlcIn .6s .5s both}' +
  '.wlc-close:hover{background:rgba(255,255,255,.22)}' +
  '.wlc-close svg{width:16px;height:16px}' +
  '.wlc button:focus-visible{outline:3px solid #7AA7FF;outline-offset:3px}' +
  /* an ordinary photo (not a transparent cut-out) is shown in a rounded glass frame */
  '.wlc-photo .wlc-figwrap{right:clamp(28px,6vw,96px);bottom:clamp(28px,7vh,76px);height:calc(var(--fh)*.84);width:calc(var(--fh)*.56);border-radius:30px;overflow:hidden;border:2px solid rgba(255,255,255,.3);box-shadow:0 36px 80px -20px rgba(0,0,0,.85),0 0 0 9px rgba(255,255,255,.06),0 0 110px rgba(21,94,239,.45)}' +
  '.wlc-photo .wlc-figwrap img{object-fit:cover;object-position:center top;filter:none;-webkit-mask-image:none;mask-image:none}' +
  '.wlc-photo{--fw:calc(var(--fh)*.56 + clamp(28px,6vw,96px))}' +
  '@keyframes wlcIn{from{opacity:0}to{opacity:1}}' +
  '@keyframes wlcRise{from{opacity:0;transform:translateY(70px)}to{opacity:1;transform:none}}' +
  '@keyframes wlcEmblem{from{opacity:0;transform:scale(.82)}to{opacity:.17;transform:none}}' +
  '@keyframes wlcSlide{from{opacity:0;transform:translateX(-34px)}to{opacity:1;transform:none}}' +
  '@keyframes wlcBeat{0%,100%{transform:scale(1)}12%{transform:scale(1.16)}24%{transform:scale(1)}36%{transform:scale(1.1)}48%{transform:scale(1)}}' +
  /* phones and portrait screens: headline on top, her in the middle, "We love you" and the button at the bottom */
  '@media (max-width:860px) and (min-height:561px),(max-aspect-ratio:1/1){' +
    '.wlc{--fh:min(70dvh,150vw);--fw:calc(var(--fh)*2/3);--ew:min(112vw,76dvh)}' +
    '.wlc-figwrap{right:auto;left:50%;transform:translateX(-50%)}' +
    '.wlc-photo .wlc-figwrap{left:50%;right:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 150px);height:calc(var(--fh)*.72);width:calc(var(--fh)*.72*.7)}' +
    '.wlc-emblem{right:auto;left:50%;transform:translateX(-50%);bottom:calc(var(--fh)*.2);animation-name:wlcEmblemC}' +
    '.wlc-halo{right:auto;left:50%;margin-left:calc(var(--fh)*-.475)}' +
    '.wlc-fade{display:block;position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(0deg,rgba(10,16,36,.97) 0%,rgba(10,16,36,.8) 40%,transparent 100%)}' +
    '.wlc-main{inset:0;left:0;top:0;transform:none;width:auto;display:flex;flex-direction:column;justify-content:space-between;text-align:center;padding:calc(env(safe-area-inset-top,0px) + 74px) 22px calc(env(safe-area-inset-bottom,0px) + 26px)}' +
    '.wlc-brand{justify-content:center;font-size:11px;letter-spacing:.26em}.wlc-brand img{width:44px}' +
    '.wlc h1{font-size:clamp(30px,8.6vw,54px);margin-top:16px}' +
    '.wlc-foot{display:flex;flex-direction:column;align-items:center}' +
    '.wlc-love{font-size:clamp(44px,13.4vw,84px);margin-top:0}' +
    '.wlc-go{margin-top:22px;width:100%;max-width:420px;justify-content:center}' +
    '.wlc-hint{display:none}' +
  '}' +
  '@keyframes wlcEmblemC{from{opacity:0;transform:translateX(-50%) scale(.82)}to{opacity:.17;transform:translateX(-50%)}}' +
  /* squarer portrait screens (tablets): soften the cut right edge of the photo */
  '@media (max-aspect-ratio:1/1) and (min-aspect-ratio:2/3){.wlc-figwrap img{-webkit-mask-image:linear-gradient(90deg,#000 0,#000 88%,transparent 100%);mask-image:linear-gradient(90deg,#000 0,#000 88%,transparent 100%)}}' +
  '@media (max-height:560px) and (orientation:landscape){.wlc{--fh:min(98dvh,58vw)}.wlc-main{top:50%}.wlc-brand{font-size:10px;letter-spacing:.24em}.wlc-brand img{width:36px}.wlc h1{font-size:clamp(22px,7.4dvh,40px);margin-top:10px}.wlc-love{font-size:clamp(32px,12dvh,60px);margin-top:12px}.wlc-go{min-height:44px;margin-top:14px;padding:0 24px;font-size:11px}.wlc-hint{display:none}.wlc-close{min-height:40px;top:10px;right:12px}}' +
  '@media (prefers-reduced-motion:reduce){.wlc,.wlc *{animation:none!important;transition:none!important}}';

  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#E0212F" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.6 2.6 5 6 5c2 0 3.4 1 4.4 2.5h.2C11.6 6 13 5 15 5c3.4 0 5.1 3.6 3.6 6.8C19.5 16.4 12 21 12 21z"/></svg>';
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';

  function build(cfg) {
    if (!document.getElementById('tcc-welcome-style')) { var st = document.createElement('style'); st.id = 'tcc-welcome-style'; st.textContent = CSS; document.head.appendChild(st); }
    var el = document.createElement('div'); el.className = 'wlc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'wlcTitle');
    el.innerHTML =
      '<div class="wlc-pattern"></div><div class="wlc-emblem"></div><div class="wlc-halo"></div>' +
      '<div class="wlc-figwrap"><picture><source type="image/webp" srcset="/assets/welcome/welcome-cutout-sm.webp 768w, /assets/welcome/welcome-cutout.webp 1024w" sizes="(max-width:860px) 100vw, 60vh"><img src="/assets/welcome/welcome-cutout.png" width="1024" height="1536" alt="A warm welcome from the Christocentric Church family" decoding="async"></picture></div>' +
      '<div class="wlc-fade"></div>' +
      '<button type="button" class="wlc-close" aria-label="Close the welcome page and enter the website"><span>Close</span>' + X + '</button>' +
      '<div class="wlc-main"><div class="wlc-head"><div class="wlc-brand"><img src="/assets/logo-emblem.png" alt="">The Christocentric Church</div>' +
      '<h1 id="wlcTitle">Welcome to the <em>Christocentric Church</em> platform</h1></div>' +
      '<div class="wlc-foot"><div class="wlc-love"><span>We love you</span>' + HEART + '</div>' +
      '<button type="button" class="wlc-go"><span>Enter the website</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
      '<div class="wlc-hint">or press Esc to close</div></div></div>';
    setHeadline(el.querySelector('#wlcTitle'), cfg.title);
    el.querySelector('.wlc-love span').textContent = cfg.love;
    el.querySelector('.wlc-go span').textContent = cfg.button;
    if (cfg.photo) {
      var fw = el.querySelector('.wlc-figwrap'); fw.textContent = '';
      var im = document.createElement('img'); im.alt = 'A warm welcome'; im.decoding = 'async'; im.src = cfg.photo; fw.appendChild(im);
      if (cfg.mode === 'photo') el.classList.add('wlc-photo');
    }
    return el;
  }

  function show(cfg) {
    if (open) return; open = true;
    root = build(cfg); lastFocus = document.activeElement;
    document.body.appendChild(root);
    document.documentElement.style.overflow = 'hidden';
    inerted = []; Array.prototype.forEach.call(document.body.children, function (n) { if (n !== root && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE' && !n.hasAttribute('inert')) { n.setAttribute('inert', ''); inerted.push(n); } });
    ls(KEY, String(Date.now()));
    root.querySelector('.wlc-close').onclick = close; root.querySelector('.wlc-go').onclick = close;
    setTimeout(function () { var g = root && root.querySelector('.wlc-go'); if (g) g.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    if (!open || !root) return; open = false;
    var r = root; root = null; r.classList.add('out');
    document.documentElement.style.overflow = '';
    inerted.forEach(function (n) { n.removeAttribute('inert'); }); inerted = [];
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 480);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    window.scrollTo(0, 0);
  }
  document.addEventListener('keydown', function (e) {
    if (!open || !root) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      var f = root.querySelectorAll('button'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function launchActive() { var l = document.getElementById('launchScreen'); return !!(l && l.classList.contains('active')); }
  function seenRecently(hours) { var t = Number(ls(KEY) || 0); return !!t && Date.now() - t < hours * 3600e3; }
  window.TCCWelcome = { open: function () { loadCfg().then(function (s) { if (!launchActive()) show(normalize(s)); }); }, close: close };

  function start() {
    loadCfg();                                    // fetch the settings while the page finishes loading
    var shown = false;
    function go(cfg) {
      if (shown) return;
      if (launchActive()) return;                 // the launch countdown screen has priority
      shown = true;
      // preload her photo so the page appears complete rather than popping in
      var im = new Image(), done = false; function fire() { if (!done) { done = true; show(cfg); } }
      im.onload = fire; im.onerror = fire; im.src = cfg.photo || '/assets/welcome/welcome-cutout-sm.webp'; setTimeout(fire, 2500);
    }
    function run() {
      loadCfg().then(function (s) {
        var cfg = normalize(s);
        if (!forced && (!cfg.enabled || seenRecently(cfg.hours))) return;
        go(cfg);
      });
    }
    // wait for the page + its settings (which decide whether the launch screen shows)
    if (document.readyState === 'complete') setTimeout(run, 900); else window.addEventListener('load', function () { setTimeout(run, 900); });
    // if the launch screen turns on while we are open, step aside
    var l = document.getElementById('launchScreen');
    if (l && window.MutationObserver) new MutationObserver(function () { if (launchActive() && open) close(); }).observe(l, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
