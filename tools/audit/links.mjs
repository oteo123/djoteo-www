// Link + asset audit for every page: every internal href resolves (HEAD 200), every image decodes, no duplicate ids, console errors.
import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com';
const pages = ['/', '/works/', '/works/debonair-supper-club/', '/works/casa-mezcal/', '/works/the-h-orlando/', '/works/helena-modern-riviera/', '/works/ava-mediterraegean/', '/blog/', '/blog/casa-mezcal-oct-10-2026/', '/blog/casa-mezcal-oct-3-2026/', '/blog/opening-for-mochakk-sept-12-2026/', '/blog/ava-mm-lounge-july-6-2024/', '/about', '/residencies', '/booking', '/contact', '/presskit', '/presskit-text', '/rentals', '/foowr', '/ugc', '/404.html'];
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
const checked = new Map(); let broken = 0, badImg = 0, dupIds = 0, consoleErr = 0;
async function head(u) { if (checked.has(u)) return checked.get(u); let s = 0; try { const r = await ctx.request.fetch(u, { method: 'GET', maxRedirects: 5, timeout: 20000 }); s = r.status(); } catch { s = -1; } checked.set(u, s); return s; }
for (const path of pages) {
  const errs = []; p.on('console', m => { if (m.type() === 'error' && !/youtube|googlevideo|canva|favicon|ERR_BLOCKED/i.test(m.text())) errs.push(m.text().slice(0, 90)); });
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += 900) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(100); }
  const info = await p.evaluate(() => { const hrefs = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith(location.origin)))]; const imgs = [...document.querySelectorAll('img')].filter(i => i.getBoundingClientRect().width > 0 && i.complete && i.naturalWidth === 0 && i.currentSrc).map(i => i.currentSrc.slice(-60)); const ids = {}; for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] || 0) + 1; const dups = Object.entries(ids).filter(([k, v]) => v > 1).map(([k]) => k); return { hrefs, imgs, dups }; });
  const bad = []; for (const h of info.hrefs) { const s = await head(h); if (s !== 200) bad.push(h.replace(BASE, '') + '=' + s); }
  broken += bad.length; badImg += info.imgs.length; dupIds += info.dups.length; consoleErr += errs.length;
  if (bad.length || info.imgs.length || errs.length || info.dups.length) console.log(path, 'broken:', bad.join(' '), 'imgs:', info.imgs.join(' '), 'dupIds:', info.dups.join(','), 'console:', errs[0] || '');
  p.removeAllListeners('console');
}
await b.close(); console.log(`LINKS: broken=${broken} undecodable-images=${badImg} duplicate-ids=${dupIds} console-errors=${consoleErr}`);
