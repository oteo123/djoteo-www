import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await p.goto((process.env.BASE || 'http://127.0.0.1:8765') + '/blog/casa-mezcal-oct-10-2026/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const f = document.querySelector('footer'); const fig = f.querySelector('.framer-14c529k'); const g = getComputedStyle(fig); const head = [...f.querySelectorAll('h1,h2,h3,p')].find(e => /Book the Night/.test(e.textContent)); const R = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; }; const pill = f.querySelector('a[href*="booking"], a[href*="contact"]'); return { footer: R(f), figure: R(fig), figCss: { h: g.height, w: g.width, left: g.left, bottom: g.bottom, top: g.top, pos: g.position }, headline: head && R(head), pill: pill && R(pill), pillText: pill && pill.textContent.trim().slice(0, 20), figParent: fig.parentElement.getAttribute('data-framer-name') + ' ' + R(fig.parentElement) }; });
  console.log(w + 'px', JSON.stringify(r));
  await p.screenshot({ path: `/tmp/footer_${w}.png`, fullPage: false });
}
await b.close();
