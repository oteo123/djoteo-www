import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.goto('http://127.0.0.1:8765/blog/casa-mezcal-oct-10-2026/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
console.log(await p.evaluate(() => { const w = document.querySelector('[data-oteo-player]'); const g = getComputedStyle(w); const par = w.parentElement; const gp = getComputedStyle(par); const kids = [...par.children].map(c => (c.getAttribute('data-framer-name') || c.tagName) + ':' + Math.round(c.getBoundingClientRect().left) + '/' + Math.round(c.getBoundingClientRect().width)); return `player margin=${g.marginLeft}/${g.marginRight} flex=${g.flex} | parent ${par.getAttribute('data-framer-name')} display=${gp.display} dir=${gp.flexDirection} align=${gp.alignItems} justify=${gp.justifyContent} w=${Math.round(par.getBoundingClientRect().width)} | kids ${kids.join(' ')}`; }));
await b.close();
