import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const BASE = 'https://djoteo.com';
for (const path of ['/works/', '/', '/residencies', '/booking', '/rentals', '/about']) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const req = [];
  p.on('response', r => { if (/\.(woff2?|ttf|otf)(\?|$)/i.test(r.url())) req.push(r.url().replace(BASE, '') + ' ' + r.status()); });
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1500);
  const faces = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight));
  console.log(path, '\n   files:', req.join('\n          '), '\n   loaded faces:', faces.join(', '));
  await p.context().close();
}
await b.close();
