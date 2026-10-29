import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })).newPage();
await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
const r = await p.evaluate(() => { const f = [...document.querySelectorAll('[data-framer-name="Filter"]')].find(e => e.getBoundingClientRect().width > 0); const d = e => { const g = getComputedStyle(e); const r = e.getBoundingClientRect(); return { el: (e.getAttribute('data-framer-name') || e.className.toString().split(' ')[0]), w: Math.round(r.width), sw: e.scrollWidth, display: g.display, wrap: g.flexWrap, ov: g.overflow, ws: g.whiteSpace, kids: e.children.length }; }; return { filter: d(f), children: [...f.children].map(d), grandchildren: f.children[0] ? [...f.children[0].children].slice(0, 3).map(d) : [] }; });
console.log(JSON.stringify(r, null, 1)); await b.close();
