import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const [w, h, t] of [[390, 844, 'm'], [1000, 900, 't'], [1440, 900, 'd']]) for (const path of ['/works/', '/about', '/rentals']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, deviceScaleFactor: 1 })).newPage();
  await p.goto('http://127.0.0.1:8765' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  const y = await p.evaluate(() => { const f = [...document.querySelectorAll('footer[data-framer-name="Footer"]')].find(e => e.getBoundingClientRect().height > 0); return f.getBoundingClientRect().top + scrollY; });
  const fh = await p.evaluate(() => { const f = [...document.querySelectorAll('footer[data-framer-name="Footer"]')].find(e => e.getBoundingClientRect().height > 0); return f.getBoundingClientRect().height; });
  await p.screenshot({ path: `/tmp/chrome/fc_${t}_${path.replace(/\W+/g, '')}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(fh, 1400) } });
  await p.context().close();
}
await b.close(); console.log('ok');
