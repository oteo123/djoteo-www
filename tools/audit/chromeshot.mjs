import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const BASE = 'http://127.0.0.1:8765';
for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
  for (const [path, name] of [['/about', 'about'], ['/works/', 'works']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, isMobile: w < 500 }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 80)));
    await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.screenshot({ path: `/tmp/chrome/${tag}_${name}_top.png`, clip: { x: 0, y: 0, width: w, height: 140 } });
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1200);
    await p.screenshot({ path: `/tmp/chrome/${tag}_${name}_bottom.png` });
    if (tag === 'm' && name === 'about') { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.click('[data-oteo-chrome-header] [data-framer-name="Menu"]').catch(e => errs.push('menu click ' + String(e).slice(0, 60))); await p.waitForTimeout(600); await p.screenshot({ path: `/tmp/chrome/m_about_menu.png` }); }
    if (errs.length) console.log(name, tag, 'errors', errs); await ctx.close();
  }
}
await b.close(); console.log('shots ok');
