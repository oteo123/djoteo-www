import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com'; const W = Number(process.env.W || 1440), H = Number(process.env.H || 900); const tag = W < 500 ? 'm' : 'd';
const pages = (process.argv[2] || '/,/works/,/works/casa-mezcal/,/blog/,/blog/casa-mezcal-oct-10-2026/,/about,/residencies,/booking,/contact,/presskit,/rentals,/foowr,/ugc,/404.html').split(',');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: W < 500 }); const p = await ctx.newPage();
for (const path of pages) {
  await p.goto(BASE + path, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1500);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += H * 0.8) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.screenshot({ path: `/tmp/vis/${tag}_${path.replace(/\W+/g, '_') || 'home'}.png`, fullPage: true });
}
await b.close(); console.log('ok');
