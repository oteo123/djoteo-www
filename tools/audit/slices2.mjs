import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8765'; const OUT = '/tmp/slices2'; require('fs').mkdirSync(OUT, { recursive: true });
const targets = [['/404.html', 1440, 'body', '404-d'], ['/ugc', 1440, 'body', 'ugc-d'], ['/works/', 390, '[data-framer-name="Filter"]', 'filter-m'], ['/rentals', 390, '.cat-jump', 'rentals-m'], ['/about', 1440, 'footer', 'about-footer-d'], ['/', 1440, 'footer', 'home-footer-d'], ['/blog/', 1440, 'main', 'blog-d'], ['/ugc', 390, 'body', 'ugc-m'], ['/404.html', 390, 'body', '404-m']];
const b = await chromium.launch();
for (const [path, w, sel, name] of targets) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500 }); const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += 700) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(80); }
  const y = await p.evaluate(sel => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY - 70 : 0; }, sel);
  await p.evaluate(y => window.scrollTo(0, Math.max(0, y)), y); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close();
}
await b.close();
