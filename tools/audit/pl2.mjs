import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [390, 844]]) { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); await p.goto('http://127.0.0.1:8765/blog/casa-mezcal-oct-10-2026/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
  console.log(w, await p.evaluate(() => { const r = document.querySelector('[data-oteo-player]').getBoundingClientRect(); const t = [...document.querySelectorAll('h1,h2,h3,p')].find(e => /4 Hour Set/.test(e.textContent) && e.getBoundingClientRect().width > 0).getBoundingClientRect(); const txt = [...document.querySelectorAll('p')].find(e => /Recorded on/.test(e.textContent)).getBoundingClientRect(); return `player x=${Math.round(r.left)} w=${Math.round(r.width)} y=${Math.round(r.top)} | title x=${Math.round(t.left)} y=${Math.round(t.top)} | text x=${Math.round(txt.left)} y=${Math.round(txt.top)}`; }));
  await p.screenshot({ path: `/tmp/chrome/player_${w}.png` }); await p.context().close(); }
await b.close();
