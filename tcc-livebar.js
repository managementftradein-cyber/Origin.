/* ==========================================================================
   "LIVE NOW" pill: when the church goes live (automatically from YouTube, or from the
   Admin switch), a small glass pill appears under the header on every page except /live.
   Tapping it opens the Live page. Hidden once dismissed (until the next broadcast).
   ========================================================================== */
(function () {
  'use strict';
  if (/^\/(live|admin|dept-admin)(\.html)?\/?$/.test(location.pathname) || /^\/(admin|dept-admin)\//.test(location.pathname)) return;
  var bar = null, anchor = null, data = null;
  function dismissedKey(d) { return 'tcc_livebar_x:' + (d.stream_url || '') + '|' + (d.title || ''); }
  function isDismissed(d) { try { return sessionStorage.getItem(dismissedKey(d)) === '1'; } catch (e) { return false; } }

  var st = document.createElement('style');
  st.textContent =
    '.tcc-livebar{position:fixed;z-index:999;left:50%;transform:translateX(-50%);max-width:min(600px,calc(100vw - 24px));display:flex;align-items:center;gap:12px;padding:9px 10px 9px 14px;color:#fff;font:500 13px/1.3 Inter,system-ui,sans-serif;' +
      'background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04)),rgba(10,17,40,.72);-webkit-backdrop-filter:blur(18px) saturate(170%);backdrop-filter:blur(18px) saturate(170%);' +
      'border:1px solid rgba(255,255,255,.22);box-shadow:0 18px 44px -16px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.2);animation:tccLbIn .5s cubic-bezier(.22,1,.36,1)}' +
    '.tcc-livebar .dot{flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:#ff3b4a;box-shadow:0 0 0 0 rgba(255,59,74,.7);animation:tccLbPulse 1.6s infinite}' +
    '.tcc-livebar .tag{flex:0 0 auto;font:800 10px Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#ff9aa3}' +
    '.tcc-livebar .ttl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}' +
    '.tcc-livebar a.go{flex:0 0 auto;background:#C1121F;color:#fff;font:700 11px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:9px 13px;text-decoration:none}' +
    '.tcc-livebar a.go:hover{background:#d9172a}' +
    '.tcc-livebar button{flex:0 0 auto;border:0;background:none;color:#9dbbff;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}' +
    '@keyframes tccLbIn{from{opacity:0;transform:translate(-50%,-14px)}to{opacity:1;transform:translateX(-50%)}}' +
    '@keyframes tccLbPulse{0%{box-shadow:0 0 0 0 rgba(255,59,74,.65)}70%{box-shadow:0 0 0 9px rgba(255,59,74,0)}100%{box-shadow:0 0 0 0 rgba(255,59,74,0)}}' +
    '@media (prefers-reduced-motion:reduce){.tcc-livebar,.tcc-livebar .dot{animation:none}}';
  document.head.appendChild(st);

  function place() {
    if (!bar) return;
    anchor = anchor || document.querySelector('header, .tcc-brandbar');
    var b = anchor ? anchor.getBoundingClientRect().bottom : 70;
    bar.style.top = Math.max(8, Math.round(b) + 10) + 'px';
  }
  function show(d) {
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'tcc-livebar'; bar.setAttribute('role', 'status');
      bar.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="tag">Live now</span><span class="ttl"></span><a class="go" href="/live">Watch</a><button type="button" aria-label="Dismiss">\u00d7</button>';
      bar.querySelector('button').onclick = function () { try { sessionStorage.setItem(dismissedKey(data), '1'); } catch (e) {} hide(); };
      document.body.appendChild(bar);
    }
    data = d;
    var t = (d.title || 'TCC Live'); var el = bar.querySelector('.ttl'); if (el.textContent !== t) el.textContent = t;
    place();
  }
  function hide() { if (bar) { bar.remove(); bar = null; } }

  function check() {
    fetch('/api/live-status', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.is_live && !isDismissed(d)) show(d); else hide();
    }).catch(function () {});
  }
  var raf = 0;
  function onMove() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; place(); }); }
  window.addEventListener('scroll', onMove, { passive: true });
  window.addEventListener('resize', onMove);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.addEventListener('load', function () { setTimeout(check, 1200); });
  setInterval(function () { if (!document.hidden) check(); }, 45000);
})();
