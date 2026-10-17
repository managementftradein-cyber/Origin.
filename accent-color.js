/**
 * TCC Accent Color
 *
 * ON LOAD the site always shows the Origin brand pair:
 *   primary accent  = Blue #155EEF   (--red / --tcc-red   — legacy variable names)
 *   action colour   = Red  #C1121F   (--crimson / --crimson-rgb — buttons & CTAs)
 *
 * The legacy variable names (--red, --tcc-red …) are kept on purpose: every
 * page, the admin dashboards and the stylesheets already read them, so the
 * primary accent can change without touching hundreds of rules. Despite the
 * name, --red / --tcc-red now hold the PRIMARY BLUE.
 *
 * After load, every click still generates a fresh, unique accent pair
 * (existing behaviour, preserved). The hue advances by the golden angle
 * (~137.5°) so it never repeats; the action colour is taken from a second,
 * offset hue so both colours always change together.
 */
(function () {
  var GOLDEN = 137.508;
  var BLUE = { hex: '#155EEF', rgb: '21,94,239', tint: '#7AA7FF' };
  var RED = { hex: '#C1121F', rgb: '193,18,31', hover: '#E01B2B' };

  // Hue of #155EEF is ~221°; used as the starting point for click cycling.
  var state = { hue: 221 };

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  function toHex(rgb) {
    return '#' + rgb.map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  function set(vars) {
    var root = document.documentElement.style;
    for (var k in vars) root.setProperty(k, vars[k]);
  }

  // The fixed brand palette — applied immediately on every page load.
  function applyBrand() {
    set({
      '--tcc-red': BLUE.hex, '--tcc-red-rgb': BLUE.rgb, '--tcc-red2': BLUE.tint,
      '--red': BLUE.hex, '--red-rgb': BLUE.rgb, '--red2': BLUE.tint,
      '--crimson': RED.hex, '--crimson-rgb': RED.rgb, '--crimson-hover': RED.hover
    });
  }

  // A new, unique accent pair for each click.
  function applyNext() {
    state.hue = (state.hue + GOLDEN) % 360;
    var sat = 62 + Math.random() * 26;            // 62–88 %
    var light = 46 + Math.random() * 12;          // 46–58 %
    var base = hslToRgb(state.hue, sat, light);
    var tint = hslToRgb(state.hue, Math.max(25, sat - 15), Math.min(90, light + 26));
    var hue2 = (state.hue + GOLDEN) % 360;        // second, offset hue for CTAs
    var act = hslToRgb(hue2, 72 + Math.random() * 14, 38 + Math.random() * 8);
    var actHover = hslToRgb(hue2, 78, 48);

    set({
      '--tcc-red': toHex(base), '--tcc-red-rgb': base.join(','), '--tcc-red2': toHex(tint),
      '--red': toHex(base), '--red-rgb': base.join(','), '--red2': toHex(tint),
      '--crimson': toHex(act), '--crimson-rgb': act.join(','), '--crimson-hover': toHex(actHover)
    });
  }

  applyBrand();
  document.addEventListener('click', applyNext);

  // Smooth colour changes on click WITHOUT overriding anything that already
  // has its own transition. :where() gives this rule zero specificity, so
  // element-specific rules (.card{transition:.55s}, .reveal, scroll effects…)
  // still win. The old rule used `*{transition:… !important}`, which silently
  // cancelled every transform/opacity transition on the site.
  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent =
      ':where(*){transition:color .35s ease,background-color .35s ease,' +
      'border-color .35s ease,box-shadow .35s ease,fill .35s ease,stroke .35s ease}';
    document.head.appendChild(style);
  });
})();
