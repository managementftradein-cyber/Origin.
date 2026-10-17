/**
 * TCC scroll effects
 *
 * Every tile, photo and block of text on the public pages slides in as it
 * scrolls into view — and again each time it comes back into view, whether
 * the visitor is scrolling down OR up.
 *
 * What makes each one unique:
 *   - every element gets its own entry variant (side, distance, scale, tilt)
 *     picked from a table so that neighbouring elements never match
 *   - the vertical part of the motion follows the scroll direction:
 *     scrolling down slides things up from below, scrolling up drops them
 *     in from above
 *   - photos reveal with a wipe from a side (or top/bottom) plus a slow zoom
 *   - each page has its own "theme" (speed, easing, reach, tilt, starting
 *     variant), so Home, About, Programs, Community, Live … all feel different
 *   - elements revealed together are staggered
 *
 * Works for content rendered later (single-page routes, community feed,
 * news, prophetic words) via a MutationObserver.
 * Respects prefers-reduced-motion. If anything fails, everything is shown.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window) || !document.querySelectorAll) return;

  /* ---------- what gets animated ---------- */
  var PHOTO = 'figure,img,video,iframe,.about-image,.tcc-post-image,.tcc-player,.tcc-map-frame';
  var TILE = '.card,.tcc-card,.tcc-panel,.tcc-post,.tcc-comment,.event,.info-item,.tcc-map-card,' +
             '.tcc-empty,article,.form,.tcc-composer,.tcc-authform,.footgrid>div,.grid3>*';
  var TEXT = 'h1,h2,h3,h4,p,.eyebrow,.tcc-kicker,.tcc-meta,.quote,.copy,.hero-actions,.hero-note,' +
             '.filters,.copyright,.btn,.tcc-btn,.tcc-map-btn';
  /* wrappers around lists that are filled in later: animate the items, not the wrapper */
  var DYNAMIC = '#feed,.tcc-feed,.tcc-news';
  var ALL = PHOTO + ',' + TILE + ',' + TEXT;

  /* never animate navigation, headers, overlays, backgrounds, logos */
  var SKIP = 'header,nav,.tcc-brandbar,.tcc-mobile-appbar,.tcc-mobile-header,.tcc-more-sheet,' +
             '.tcc-more-backdrop,.tcc-desktop-hub,.tcc-feature-nav,.navlinks,#launchScreen,#loader,' +
             '.transition,.tcc-transition,.hero-bg,.brand,.loader-mark,.launch-brand,.tcc-avatar,' +
             '.tcc-skel,[data-fx-skip],dialog,[role="dialog"],[aria-hidden="true"]';

  /* ---------- entry variants: [x px, y (× scroll dir), scale, tilt deg] ---------- */
  var V = {
    tile: [[-110, .5, .96, 0], [110, .5, .96, 0], [0, 1.5, .92, 0], [-70, 1, 1, -2],
           [70, 1, 1, 2], [-140, 0, 1, 0], [140, 0, 1, 0], [0, 1.1, .88, 0]],
    text: [[-80, .3, 1, 0], [80, .3, 1, 0], [-50, .8, 1, 0], [50, .8, 1, 0],
           [0, 1, 1, 0], [-120, 0, 1, 0], [120, 0, 1, 0]],
    photo: [[-90, .3, 1, 0, 'l'], [90, .3, 1, 0, 'r'], [0, 1, .94, 0, 'v'],
            [-60, .6, 1, -1.5, 'l'], [60, .6, 1, 1.5, 'r'], [0, .4, 1, 0, 'v']]
  };

  /* ---------- per-page themes ---------- */
  var THEMES = {
    home:        { dur: .95, ease: 'cubic-bezier(.22,1,.36,1)',   reach: 1.0, tilt: 0,    start: 0 },
    about:       { dur: 1.05, ease: 'cubic-bezier(.16,1,.3,1)',   reach: 1.2, tilt: 1.5,  start: 2 },
    programs:    { dur: .8,  ease: 'cubic-bezier(.34,1.4,.64,1)', reach: 1.0, tilt: 0,    start: 5 },
    partnership: { dur: 1.0, ease: 'cubic-bezier(.19,1,.22,1)',   reach: 1.4, tilt: 0,    start: 1 },
    college:     { dur: .9,  ease: 'cubic-bezier(.25,1,.5,1)',    reach: .9,  tilt: 2,    start: 3 },
    give:        { dur: 1.1, ease: 'cubic-bezier(.16,1,.3,1)',    reach: 1.1, tilt: 0,    start: 4 },
    contact:     { dur: .85, ease: 'cubic-bezier(.22,1.2,.36,1)', reach: 1.3, tilt: -1.5, start: 6 },
    community:   { dur: .8,  ease: 'cubic-bezier(.34,1.56,.64,1)', reach: .8, tilt: 0,    start: 2 },
    live:        { dur: .7,  ease: 'cubic-bezier(.2,.9,.3,1)',    reach: 1.2, tilt: 0,    start: 4 },
    news:        { dur: 1.0, ease: 'cubic-bezier(.22,1,.36,1)',   reach: 1.0, tilt: 1,    start: 1 },
    prophetic:   { dur: 1.2, ease: 'cubic-bezier(.16,1,.3,1)',    reach: 1.5, tilt: -2,   start: 5 }
  };

  function themeName() {
    var p = (location.pathname || '/').toLowerCase().replace(/\.html$/, '').replace(/\/+$/, '');
    if (p === '' || p === '/index') return 'home';
    p = p.replace(/^\//, '');
    if (p.indexOf('prophetic') === 0) return 'prophetic';
    return THEMES[p] ? p : 'home';
  }

  /* ---------- state ---------- */
  var lastY = window.pageYOffset || 0;
  var dir = 1;                       // 1 = scrolling down, -1 = scrolling up
  var serial = { tile: 0, text: 0, photo: 0 };
  var io = null;
  var pending = false;

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || 0;
    if (y !== lastY) { dir = y > lastY ? 1 : -1; lastY = y; }
  }, { passive: true });

  function kindOf(el) {
    if (el.matches(PHOTO)) return 'photo';
    if (el.matches(TILE)) return 'tile';
    return 'text';
  }

  function stride(n) { return n % 2 ? 3 : 5; }   // coprime with the table sizes

  function tag(el) {
    var kind = kindOf(el);
    var table = V[kind];
    var th = THEMES[themeName()];
    var n = serial[kind]++;
    el._fxv = table[(th.start + n * stride(table.length)) % table.length];
    el._fxt = th;
    el.setAttribute('data-fx', '');
    el.setAttribute('data-fx-kind', kind);
    el.addEventListener('animationend', function (e) {
      if (e.target === el) el.classList.add('fx-done');
    });
    io.observe(el);
  }

  function scan() {
    pending = false;
    try {
      var list = document.querySelectorAll(ALL);
      var vh = window.innerHeight || 800;
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el._fxTagged) continue;
        if (el.closest(SKIP)) continue;
        if (el.parentElement && el.parentElement.closest('[data-fx]')) continue; // an ancestor already moves
        if (el.matches(TILE) && !el.matches(PHOTO) && (el.matches(DYNAMIC) || el.querySelector(DYNAMIC))) continue;
        if (el.offsetHeight > vh * 1.25) continue;                                // too tall: its children animate instead
        if (el.tagName === 'IMG' && el.naturalWidth && el.naturalWidth < 40) continue; // tracking pixels / icons
        el._fxTagged = true;
        tag(el);
      }
    } catch (err) {
      fail(err);
    }
  }

  function schedule() {
    if (pending) return;
    pending = true;
    (window.requestAnimationFrame || setTimeout)(scan);
  }

  function play(el, delay) {
    var v = el._fxv, th = el._fxt;
    var mf = (window.innerWidth || 1024) < 700 ? .45 : 1;       // gentler on phones
    var x = v[0] * th.reach * mf;
    var y = dir * v[1] * 56;
    var s = el.style;
    s.setProperty('--fx-x', x.toFixed(1) + 'px');
    s.setProperty('--fx-y', y.toFixed(1) + 'px');
    s.setProperty('--fx-s', v[2]);
    s.setProperty('--fx-r', (v[3] + (x < 0 ? -1 : 1) * th.tilt * .5).toFixed(2) + 'deg');
    s.setProperty('--fx-dur', th.dur + 's');
    s.setProperty('--fx-ease', th.ease);
    s.setProperty('--fx-delay', (delay / 1000).toFixed(2) + 's');
    if (v[4]) {
      var clip = v[4] === 'l' ? 'inset(0 100% 0 0)'
               : v[4] === 'r' ? 'inset(0 0 0 100%)'
               : (dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)');
      s.setProperty('--fx-clip', clip);
    }
    el.classList.remove('fx-done');
    el.classList.add('fx-in');
  }

  function onIntersect(entries) {
    var show = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i], el = e.target;
      if (e.isIntersecting) {
        var enough = e.intersectionRatio >= .1 ||
                     e.intersectionRect.height >= Math.min((window.innerHeight || 800) * .2, 160);
        if (enough && !el.classList.contains('fx-in')) show.push(e);
      } else if (el.classList.contains('fx-in')) {
        el.classList.remove('fx-in', 'fx-done');   // fully out of view: re-arm for the next pass
      }
    }
    // stagger elements revealed in the same moment, top-to-bottom then left-to-right
    show.sort(function (a, b) {
      return (a.boundingClientRect.top - b.boundingClientRect.top) ||
             (a.boundingClientRect.left - b.boundingClientRect.left);
    });
    for (var j = 0; j < show.length; j++) play(show[j].target, Math.min(j * 70, 420));
  }

  function fail(err) {
    if (window.console) console.warn('[tcc-fx] disabled:', err);
    try {
      if (io) io.disconnect();
      var all = document.querySelectorAll('[data-fx]');
      for (var i = 0; i < all.length; i++) all[i].removeAttribute('data-fx');
    } catch (_) { /* nothing more we can do */ }
  }

  function start() {
    try {
      io = new IntersectionObserver(onIntersect, { threshold: [0, .1, .2], rootMargin: '0px 0px -6% 0px' });
      scan();
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
      window.addEventListener('load', schedule);
      window.addEventListener('resize', schedule);
      window.addEventListener('popstate', function () { serial = { tile: 0, text: 0, photo: 0 }; schedule(); });
      // images/fonts finishing late can change heights — look again shortly after load
      setTimeout(schedule, 600);
      setTimeout(schedule, 1800);
    } catch (err) {
      fail(err);
    }
  }

  window.TCCFX = { scan: schedule };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
