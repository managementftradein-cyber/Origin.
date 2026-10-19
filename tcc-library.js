/* ==========================================================================
   Pastor's Library link (cyberbishop.org) — one place controls every spot on the site:
   home band, TCC Hub menu, mobile menu, footer, feature-page menus.
   Admin → Church Settings → "Pastor's Library" can change the link/text or switch it off.
   Works with defaults even before the database fields exist.
   ========================================================================== */
(function () {
  'use strict';
  var DEF = {
    enabled: true,
    url: 'https://cyberbishop.org',
    title: 'Books, videos & songs by our pastor',
    text: 'Everything our pastor has written, recorded and sung is gathered in one place. Read, watch and listen, and let it strengthen your walk with Christ.',
    button: 'Visit the Library'
  };
  var lib = {}; for (var k in DEF) lib[k] = DEF[k];
  var pending = false;

  function safeUrl(u) {
    try { var x = new URL(String(u || '').trim()); return /^https?:$/.test(x.protocol) ? x.href : DEF.url; }
    catch (e) { return DEF.url; }
  }
  function setText(el, v) { if (v != null && el.textContent !== v) el.textContent = v; }

  function apply() {
    pending = false;
    var show = lib.enabled !== false;
    document.querySelectorAll('[data-library-link]').forEach(function (a) {
      if (a.getAttribute('href') !== lib.url) a.setAttribute('href', lib.url);
    });
    document.querySelectorAll('[data-library-item],[data-library-band]').forEach(function (el) {
      var want = show ? '' : 'none';
      if (el.style.display !== want) el.style.display = want;
    });
    document.querySelectorAll('[data-lib="title"]').forEach(function (el) { setText(el, lib.title); });
    document.querySelectorAll('[data-lib="text"]').forEach(function (el) { setText(el, lib.text); });
    document.querySelectorAll('[data-lib="button"]').forEach(function (el) { setText(el, lib.button); });
  }
  function schedule() { if (!pending) { pending = true; (window.requestAnimationFrame || setTimeout)(apply); } }

  function load() {
    fetch('/api/site-content', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var s = (d && d.settings) || {};
      if (s.library_enabled === false) lib.enabled = false; else lib.enabled = true;
      lib.url = safeUrl(s.library_url || DEF.url);
      lib.title = (s.library_title || '').trim() || DEF.title;
      lib.text = (s.library_text || '').trim() || DEF.text;
      lib.button = (s.library_button || '').trim() || DEF.button;
      apply();
    }).catch(function () { /* keep defaults */ });
  }

  function start() {
    lib.url = safeUrl(lib.url);
    apply(); load();
    /* the home page is drawn by script, so re-apply whenever new elements appear */
    if (window.MutationObserver) new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  window.TCCLibrary = { apply: apply };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
