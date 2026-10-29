// Targeted viewport screenshots: page, width, and a selector or y to scroll to.
import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8765'; const OUT = process.env.OUT || '/tmp/slices'; require('fs').mkdirSync(OUT, { recursive: true });
const targets = [
  ['/works/casa-mezcal/', 1440, '[data-framer-name="The room"], section:nth-of-type(2)', 'casa-room-d'], ['/works/casa-mezcal/', 390, '[data-framer-name="The room"], section:nth-of-type(2)', 'casa-room-m'],
  ['/works/casa-mezcal/', 1440, 'footer', 'casa-footer-d'], ['/works/casa-mezcal/', 390, 'footer', 'casa-footer-m'], ['/works/casa-mezcal/', 390, 'footer .framer-1g2kv3e', 'casa-footer-m2'],
  ['/works/', 1440, 'main', 'works-d'], ['/works/', 390, '[data-framer-name="Filter"]', 'works-filter-m'],
  ['/works/the-h-orlando/', 1440, 'main', 'h-hero-d'], ['/works/the-h-orlando/', 1440, '[data-framer-name="The room"], section:nth-of-type(2)', 'h-room-d'],
  ['/works/helena-modern-riviera/', 1440, '[data-framer-name="The night"], section:nth-of-type(3)', 'helena-night-d'],
  ['/works/ava-mediterraegean/', 1440, 'main', 'ava-hero-d'], ['/works/ava-mediterraegean/', 390, '[data-framer-name="The room"], section:nth-of-type(2)', 'ava-room-m'],
  ['/blog/casa-mezcal-oct-10-2026/', 1440, 'main', 'set-d'], ['/blog/casa-mezcal-oct-10-2026/', 390, 'main', 'set-m'],
  ['/', 1440, '[data-framer-name="About me"]', 'about-me-d'], ['/', 1440, '[data-framer-name="Testimonials"]', 'testi-d'], ['/', 390, 'footer', 'home-footer-m'],
];
const b = await chromium.launch();
for (const [path, w, sel, name] of targets) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500 }); const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += 700) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(90); }
  const y = await p.evaluate(sel => { for (const s of sel.split(', ')) { const e = document.querySelector(s); if (e && e.getBoundingClientRect().height > 0) { return e.getBoundingClientRect().top + scrollY - 70; } } return 0; }, sel);
  await p.evaluate(y => window.scrollTo(0, Math.max(0, y)), y); await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close();
}
await b.close(); console.log('slices done');
