import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const path of ['/works/', '/about']) { const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); await p.goto('http://127.0.0.1:8765' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  console.log(path, await p.evaluate(() => { const f = [...document.querySelectorAll('footer[data-framer-name="Footer"]')].find(e => e.getBoundingClientRect().height > 0); const bt = f.querySelector('[data-framer-name="Bottom"]'); const R = e => { const r = e.getBoundingClientRect(); const g = getComputedStyle(e); return (e.getAttribute('data-framer-name') || e.className.toString().split(' ')[0]) + ` h=${Math.round(r.height)} disp=${g.display} pos=${g.position} gap=${g.gap} order=${g.order} mt=${g.marginTop}`; }; return [R(bt), ...[...bt.children].map(c => '  ' + R(c) + ' > ' + [...c.children].map(R).join(' ; '))].join('\n'); })); await p.context().close(); }
await b.close();
