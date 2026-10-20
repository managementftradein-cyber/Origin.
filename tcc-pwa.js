/* ==========================================================================
   TCC app (PWA): registers the service worker, offers "Install the app"
   (Android / desktop Chrome + Edge prompt, iPhone/iPad "Add to Home Screen" help),
   and shows a "new version ready" bar when an update has been downloaded.
   ========================================================================== */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var deferred = null, card = null, refreshing = false;
  var SNOOZE_KEY = 'tcc_pwa_snooze', DONE_KEY = 'tcc_pwa_installed';
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- styles ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.pwa-card,.pwa-update{position:fixed;z-index:99990;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));margin:0 auto;max-width:460px;display:flex;align-items:center;gap:14px;padding:14px 14px 14px 16px;color:#fff;font:500 13.5px/1.45 Inter,system-ui,sans-serif;' +
      'background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04)),rgba(10,17,40,.82);-webkit-backdrop-filter:blur(20px) saturate(170%);backdrop-filter:blur(20px) saturate(170%);border:1px solid rgba(255,255,255,.2);box-shadow:0 22px 60px -18px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.2);animation:pwaIn .5s cubic-bezier(.22,1,.36,1)}' +
    '.pwa-card img{width:48px;height:48px;flex:0 0 48px;border-radius:11px}' +
    '.pwa-card b,.pwa-update b{display:block;font:600 15px Georgia,serif;margin-bottom:2px}' +
    '.pwa-card span.t{color:#c8d3ee;font-size:12.5px}' +
    '.pwa-card .go,.pwa-update button{flex:0 0 auto;border:0;background:#C1121F;color:#fff;font:700 11px Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:12px 16px;cursor:pointer}' +
    '.pwa-card .go:hover,.pwa-update button:hover{background:#d9172a}' +
    '.pwa-card .x{flex:0 0 auto;border:0;background:none;color:#9dbbff;font-size:24px;line-height:1;cursor:pointer;padding:4px 6px}' +
    '.pwa-card svg{width:15px;height:15px;vertical-align:-3px;margin:0 2px}' +
    '.pwa-update{bottom:calc(16px + env(safe-area-inset-bottom,0px));justify-content:space-between}' +
    '@keyframes pwaIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}' +
    '@media (min-width:861px){.pwa-card,.pwa-update{left:24px;right:auto;margin:0}}' +
    '@media (max-width:860px){body:has(.tcc-mobile-appbar) .pwa-card,body:has(.tcc-mobile-appbar) .pwa-update{bottom:calc(86px + env(safe-area-inset-bottom,0px))}}' +
    '@media (prefers-reduced-motion:reduce){.pwa-card,.pwa-update{animation:none}}';
  document.head.appendChild(st);

  /* ---------- service worker + updates ---------- */
  function showUpdate(worker) {
    if (document.querySelector('.pwa-update')) return;
    var bar = document.createElement('div'); bar.className = 'pwa-update'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<div><b>A new version is ready</b><span style="color:#c8d3ee;font-size:12.5px">Refresh to get the latest.</span></div><button type="button">Refresh</button>';
    bar.querySelector('button').onclick = function () { worker.postMessage('SKIP_WAITING'); };
    document.body.appendChild(bar);
  }
  /* reload only when a NEW version takes over (not on a visitor's very first visit, when the worker simply starts controlling the page) */
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }
    if (refreshing) return; refreshing = true; location.reload();
  });

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', function () { if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(nw); });
      });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update().catch(function () {}); });
      setInterval(function () { reg.update().catch(function () {}); }, 60 * 60 * 1000);
    }).catch(function () { /* app still works as a normal website */ });
  });

  /* ---------- install ---------- */
  function installed() { return standalone || ls(DONE_KEY) === '1'; }
  function items(show) { document.querySelectorAll('[data-pwa-item]').forEach(function (el) { el.style.display = show ? '' : 'none'; }); }
  function canOffer() { return !installed() && (deferred || isIOS); }
  function closeCard(snooze) { if (card) { card.remove(); card = null; } if (snooze) ls(SNOOZE_KEY, String(Date.now() + 14 * 864e5)); }

  var SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  function openCard() {
    if (card || !canOffer()) return;
    card = document.createElement('div'); card.className = 'pwa-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Install the TCC app');
    var ios = !deferred && isIOS;
    card.innerHTML = '<img src="/assets/pwa/icon-192.png" alt="">' +
      '<div style="flex:1;min-width:0"><b>Install the TCC app</b><span class="t">' +
      (ios ? 'Tap ' + SHARE + ' <b style="display:inline;font:600 12.5px Inter,sans-serif">Share</b>, then <b style="display:inline;font:600 12.5px Inter,sans-serif">Add to Home Screen</b>.' : 'Open Live, Programs and Give in one tap, even on a weak connection.') +
      '</span></div>' + (ios ? '' : '<button class="go" type="button">Install</button>') + '<button class="x" type="button" aria-label="Not now">\u00d7</button>';
    var go = card.querySelector('.go'); if (go) go.onclick = install;
    card.querySelector('.x').onclick = function () { closeCard(true); };
    document.body.appendChild(card);
  }
  function install() {
    if (deferred) {
      var d = deferred; deferred = null; closeCard(false);
      d.prompt(); d.userChoice.then(function (c) { if (c && c.outcome === 'accepted') { ls(DONE_KEY, '1'); items(false); } else { ls(SNOOZE_KEY, String(Date.now() + 14 * 864e5)); } });
    } else if (isIOS) { closeCard(false); openCard(); }
  }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; items(true); schedule(); });
  window.addEventListener('appinstalled', function () { ls(DONE_KEY, '1'); deferred = null; closeCard(false); items(false); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-pwa-install]'); if (!t) return;
    e.preventDefault(); e.stopPropagation(); if (deferred) install(); else if (isIOS) { closeCard(false); openCard(); }
  }, true);

  var scheduled = false;
  function schedule() {
    if (scheduled) return; scheduled = true;
    (function attempt(n) {
      setTimeout(function () {
        var snoozed = Number(ls(SNOOZE_KEY) || 0) > Date.now();
        var gate = document.getElementById('launchScreen');
        var gateOpen = gate && gate.offsetParent !== null && getComputedStyle(gate).display !== 'none';
        if (!canOffer() || snoozed || /^\/(admin|dept-admin)/.test(location.pathname)) return;
        if (gateOpen && n < 8) return attempt(n + 1);
        openCard();
      }, n === 0 ? 20000 : 15000);
    })(0);
  }

  /* footer / menu "Install the app" links: visible only when installing is possible */
  document.addEventListener('DOMContentLoaded', function () { items(canOffer()); if (isIOS && canOffer()) schedule(); });
  new MutationObserver(function () { items(canOffer()); }).observe(document.documentElement, { childList: true, subtree: true });
})();
