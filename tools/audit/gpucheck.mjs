import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const variants = [
  ['chromium-default', {}],
  ['chrome-headless-new-metal', { channel: 'chrome', args: ['--headless=new', '--enable-gpu', '--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-zero-copy'] }],
  ['chrome-headless-new-gl', { channel: 'chrome', args: ['--headless=new', '--enable-gpu', '--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist'] }],
];
for (const [name, opts] of variants) {
  try { const b = await chromium.launch(opts); const p = await b.newPage(); await p.goto('chrome://gpu'); await p.waitForTimeout(1500);
    const t = await p.evaluate(() => document.body.innerText); const grab = k => { const m = t.match(new RegExp(k + '[^\\n]*')); return m ? m[0].slice(0, 80) : 'n/a'; };
    console.log(name, '|', grab('Compositing: '), '|', grab('Rasterization: '), '|', grab('GPU0: ')); await b.close();
  } catch (e) { console.log(name, 'FAILED', String(e).slice(0, 120)); }
}
