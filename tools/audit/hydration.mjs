// Hydration probe: React recoverable errors (#418/#422/#423/#425) and uncaught errors on every Framer page at 3 widths.
import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com';
const pages = ['/', '/works/', '/works/debonair-supper-club/', '/works/casa-mezcal/', '/works/the-h-orlando/', '/works/helena-modern-riviera/', '/works/ava-mediterraegean/', '/blog/', '/blog/casa-mezcal-oct-10-2026/', '/blog/casa-mezcal-oct-3-2026/', '/blog/opening-for-mochakk-sept-12-2026/', '/blog/ava-mm-lounge-july-6-2024/'];
const b = await chromium.launch(); let bad = 0;
for (const [w, h] of [[1440, 900], [810, 1080], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  for (const path of pages) {
    const errs = []; const cms = [];
    p.on('console', m => { const t = m.text(); if (/Minified React error #4(18|22|23|25)|Hydration|hydrat/i.test(t) || m.type() === 'error') errs.push(t.slice(0, 100)); });
    p.on('pageerror', e => errs.push('uncaught ' + String(e).slice(0, 100)));
    p.on('request', r => { if (/framercms|framerusercontent\.com\/.*\.json|api\.framer/.test(r.url())) cms.push(r.url().slice(0, 80)); });
    await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += h) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(800);
    const react = errs.filter(e => /#4(18|22|23|25)/.test(e)); const other = errs.filter(e => !/#4(18|22|23|25)/.test(e) && !/youtube|googlevideo|canva|favicon|ERR_BLOCKED|third-party/i.test(e));
    if (react.length || other.length || cms.length) { bad++; console.log(`${w}px ${path} react=${react.length} other=${other.length} cms=${cms.length}` + (other[0] ? ' | ' + other[0] : '')); }
    p.removeAllListeners('console'); p.removeAllListeners('pageerror'); p.removeAllListeners('request');
  }
  await ctx.close();
}
await b.close(); console.log(bad ? `HYDRATION: ${bad} page/width combos with problems` : 'HYDRATION: all clean');
