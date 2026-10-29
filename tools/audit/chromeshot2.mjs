import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const BASE = 'http://127.0.0.1:8765';
const pages = ['/residencies', '/booking', '/contact', '/presskit', '/presskit-text', '/rentals', '/foowr', '/ugc', '/404.html'];
for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) for (const path of pages) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500 }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 100)));
  await p.goto(BASE + path, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1200);
  const name = path.replace(/\W+/g, '_');
  await p.screenshot({ path: `/tmp/chrome/${tag}${name}_top.png`, clip: { x: 0, y: 0, width: w, height: tag === 'd' ? 400 : 500 } });
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1000);
  await p.screenshot({ path: `/tmp/chrome/${tag}${name}_bottom.png` });
  if (errs.length) console.log(path, tag, 'ERR', errs.join(' | ')); await ctx.close();
}
await b.close(); console.log('done');
