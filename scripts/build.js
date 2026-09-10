#!/usr/bin/env node
// Build step: turns the human-readable files in /src into the obfuscated,
// minified files actually deployed (in /public). Run automatically by
// Vercel on every deploy (see "buildCommand" in vercel.json) — never edit
// files in /public by hand, they get wiped and regenerated every build.
//
// Why bundle-then-mangle instead of mangling each file separately:
// several pages load 2-4 of our own <script> tags that share one global
// scope on purpose (a later script calls a function a defer'd earlier
// script defined). Renaming top-level names independently per file would
// silently break those cross-file calls. Concatenating each page's own
// scripts into a single file first makes full top-level mangling safe,
// since every reference now lives in the one file the minifier can see.
//
// Third-party scripts loaded from a CDN (the Supabase JS library) are left
// as their own <script> tag, untouched — there's nothing of ours to hide
// there, and it's already minified upstream.

const fs = require('fs');
const path = require('path');
const { minify: minifyJs } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'public');

// Each entry describes one served HTML page: which of our own CSS/JS files
// it loads (in the exact order they must execute/apply) get bundled into a
// single obfuscated file, and where the page itself lives under src/.
const PAGES = [
  {
    html: 'index.html',
    css: ['assets/extracted/index-style-1.css', 'assets/extracted/index-style-2.css', 'assets/extracted/index-style-3.css', 'assets/extracted/index-style-4.css', 'assets/extracted/index-style-5.css'],
    js: ['tcc-config.js', 'assets/extracted/index-script-1.js', 'assets/extracted/index-script-2.js', 'assets/extracted/index-script-3.js', 'accent-color.js'],
    bundle: 'index'
  },
  {
    html: 'community.html',
    css: ['assets/extracted/community-style-1.css', 'assets/extracted/community-style-2.css', 'assets/extracted/community-style-3.css', 'assets/extracted/community-style-4.css'],
    js: ['assets/extracted/community-script-1.js', 'community-auth.js', 'assets/extracted/community-script-2.js', 'assets/extracted/community-script-3.js', 'accent-color.js'],
    bundle: 'community'
  },
  {
    html: 'live.html',
    css: ['assets/extracted/live-style-1.css', 'assets/extracted/live-style-2.css', 'assets/extracted/live-style-3.css'],
    js: ['assets/extracted/live-script-1.js', 'assets/extracted/live-script-2.js', 'assets/extracted/live-script-3.js', 'accent-color.js'],
    bundle: 'live'
  },
  {
    html: 'news.html',
    css: ['assets/extracted/news-style-1.css', 'assets/extracted/news-style-2.css', 'assets/extracted/news-style-3.css'],
    js: ['assets/extracted/news-script-1.js', 'assets/extracted/news-script-2.js', 'assets/extracted/news-script-3.js', 'accent-color.js'],
    bundle: 'news'
  },
  {
    html: 'prophetic-room.html',
    css: ['assets/extracted/prophetic-room-style-1.css', 'assets/extracted/prophetic-room-style-2.css', 'assets/extracted/prophetic-room-style-3.css'],
    js: ['assets/extracted/prophetic-room-script-1.js', 'assets/extracted/prophetic-room-script-2.js', 'assets/extracted/prophetic-room-script-3.js', 'accent-color.js'],
    bundle: 'prophetic-room'
  },
  {
    html: 'admin/index.html',
    css: ['assets/extracted/index-style-1.css'],
    // index-style-2.css is a <noscript>-only fallback (it force-hides #app
    // and shows the "JavaScript is required" notice) — it must stay
    // conditional on JS being disabled, so it's handled separately below
    // instead of going into the always-loaded bundle above.
    noscriptCss: 'assets/extracted/index-style-2.css',
    js: ['admin-auth.js', 'admin/app.js'],
    bundle: 'admin/app'
  },
  {
    html: 'dept-admin/index.html',
    css: ['assets/extracted/index-style-1.css'],
    js: ['admin-auth.js', 'dept-admin/app.js'],
    bundle: 'dept-admin/app'
  }
];

// Files copied through as-is (binary assets, robots.txt) — nothing to obfuscate.
const PASSTHROUGH = ['robots.txt'];
const PASSTHROUGH_DIRS = ['assets']; // images only; extracted/ css+js are consumed by bundling above, not copied

function rimraf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyPassthroughAssets() {
  // Copy every file under src/assets EXCEPT the extracted/ folder (those
  // source css/js files feed the bundles above and should not also ship
  // to production unminified and un-obfuscated under their original names).
  const srcAssets = path.join(SRC, 'assets');
  const outAssets = path.join(OUT, 'assets');
  fs.mkdirSync(outAssets, { recursive: true });
  for (const entry of fs.readdirSync(srcAssets, { withFileTypes: true })) {
    if (entry.name === 'extracted') continue;
    const from = path.join(srcAssets, entry.name);
    const to = path.join(outAssets, entry.name);
    fs.cpSync(from, to, { recursive: true });
  }
}

async function buildCssBundle(files) {
  const combined = files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  const result = new CleanCSS({ level: 2 }).minify(combined);
  if (result.errors.length) throw new Error('CSS build failed: ' + result.errors.join('; '));
  return result.styles;
}

async function buildJsBundle(files) {
  const combined = files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n;\n');
  const result = await minifyJs(combined, {
    compress: { passes: 2 },
    mangle: { toplevel: true }, // safe: the whole page's script scope is now one file
    format: { comments: false }
  });
  if (result.error) throw result.error;
  return result.code;
}

async function buildPage(page) {
  const htmlPath = path.join(SRC, page.html);
  let html = fs.readFileSync(htmlPath, 'utf8');

  const cssOut = await buildCssBundle(page.css);
  const jsOut = await buildJsBundle(page.js);

  const cssHref = `/assets/build/${page.bundle}.css`;
  const jsSrc = `/assets/build/${page.bundle}.js`;
  fs.mkdirSync(path.dirname(path.join(OUT, 'assets/build', page.bundle)), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'assets/build', `${page.bundle}.css`), cssOut);
  fs.writeFileSync(path.join(OUT, 'assets/build', `${page.bundle}.js`), jsOut);

  // Strip every <link> to one of our own extracted CSS files and every
  // <script src> to one of our own extracted/support JS files, leaving
  // external tags (Google Fonts, the Supabase CDN) untouched. Then inject
  // exactly one <link> and one <script> pointing at the new bundle.
  for (const f of page.css) {
    const base = path.basename(f);
    html = html.replace(new RegExp(`<link[^>]*href="[^"]*${base}"[^>]*>`, 'g'), '');
  }
  for (const f of page.js) {
    const base = path.basename(f);
    html = html.replace(new RegExp(`<script[^>]*src="[^"]*${base}"[^>]*></script>`, 'g'), '');
  }
  html = html.replace('</head>', `<link rel="stylesheet" href="${cssHref}"></head>`);
  html = html.replace('</body>', `<script src="${jsSrc}" defer></script></body>`);

  // A page can have one small CSS file that must stay wrapped in <noscript>
  // (conditional fallback styling) instead of joining the always-loaded
  // bundle above. Minify it in place and repoint its href at the new path.
  if (page.noscriptCss) {
    const base = path.basename(page.noscriptCss);
    const minified = new CleanCSS({ level: 2 }).minify(fs.readFileSync(path.join(SRC, page.noscriptCss), 'utf8')).styles;
    const outName = `${page.bundle}-noscript.css`;
    fs.mkdirSync(path.dirname(path.join(OUT, 'assets/build', page.bundle)), { recursive: true });
    fs.writeFileSync(path.join(OUT, 'assets/build', outName), minified);
    html = html.replace(new RegExp(`href="[^"]*${base}"`), `href="/assets/build/${outName}"`);
  }

  html = await minifyHtml(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false // already minified/mangled above; re-minifying inline scraps is unnecessary here
  });

  const outPath = path.join(OUT, page.html);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
}

async function main() {
  rimraf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  for (const file of PASSTHROUGH) {
    fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  }
  copyPassthroughAssets();

  for (const page of PAGES) {
    await buildPage(page);
    console.log(`built ${page.html}`);
  }

  console.log('Build complete →', OUT);
}

main().catch(e => {
  console.error('Build failed:', e);
  process.exit(1);
});
