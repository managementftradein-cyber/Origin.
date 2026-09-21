














(function () {
  var RED_ANGLE = 137.508;



  var state = {
    hue: 40 + Math.random() * 10
  };

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  function toHex(rgb) {
    return (
      '#' +
      rgb
        .map(function (v) {
          return v.toString(16).padStart(2, '0');
        })
        .join('')
    );
  }

  function nextColor() {


    state.hue = (state.hue + RED_ANGLE) % 360;


    var sat = 55 + Math.random() * 30;
    var light = 48 + Math.random() * 14;
    var light2 = Math.min(92, light + 24 + Math.random() * 8);

    var base = hslToRgb(state.hue, sat, light);
    var tint = hslToRgb(state.hue, Math.max(20, sat - 15), light2);

    return {
      hex: toHex(base),
      rgb: base.join(','),
      tintHex: toHex(tint)
    };
  }

  function applyColor() {
    var c = nextColor();
    var root = document.documentElement.style;



    root.setProperty('--tcc-red', c.hex);
    root.setProperty('--tcc-red-rgb', c.rgb);


    root.setProperty('--red', c.hex);
    root.setProperty('--red-rgb', c.rgb);
    root.setProperty('--red2', c.tintHex);
  }

  document.addEventListener('click', applyColor);



  document.addEventListener('DOMContentLoaded', function () {
    var style = document.createElement('style');
    style.textContent =
      '*{transition:color .35s ease,background-color .35s ease,' +
      'border-color .35s ease,box-shadow .35s ease,fill .35s ease,' +
      'stroke .35s ease !important}';
    document.head.appendChild(style);
  });
})();
