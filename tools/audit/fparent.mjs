import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const w of [390, 1000, 1440]) { const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage(); await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  console.log(w, await p.evaluate(() => { let f = document.querySelector('footer[data-framer-name="Footer"]'); const out = []; let a = f.parentElement; for (let i = 0; i < 3 && a; i++) { out.push(a.className); a = a.parentElement; } return out.join(' | '); })); await p.context().close(); }
await b.close();
