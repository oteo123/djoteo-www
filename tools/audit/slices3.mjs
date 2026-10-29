import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8765'; const OUT = '/tmp/slices3'; require('fs').mkdirSync(OUT, { recursive: true });
const targets = [['/works/', 390, '[data-framer-name="Filter"]', 'filter-m'], ['/works/casa-mezcal/', 390, 'main', 'casa-hero-m'], ['/works/the-h-orlando/', 390, 'main', 'h-hero-m'], ['/404.html', 1440, 'body', '404-d'], ['/works/debonair-supper-club/', 1440, '[data-framer-name="The night"], section:nth-of-type(3)', 'deb-night-d'], ['/works/helena-modern-riviera/', 1440, '[data-framer-name="The night"], section:nth-of-type(3)', 'hel-night-d'], ['/', 390, '[data-framer-name="About me"]', 'about-m']];
const b = await chromium.launch();
for (const [path, w, sel, name] of targets) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500 }); const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += 700) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(80); }
  const y = await p.evaluate(sel => { for (const s of sel.split(', ')) { const e = document.querySelector(s); if (e && e.getBoundingClientRect().height > 0) return e.getBoundingClientRect().top + scrollY - 70; } return 0; }, sel);
  await p.evaluate(y => window.scrollTo(0, Math.max(0, y)), y); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close();
}
await b.close();
