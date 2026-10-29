import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true })).newPage();
await p.goto('http://127.0.0.1:8765/works/casa-mezcal/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
const r = await p.evaluate(() => { const img = [...document.querySelectorAll('img[src*="casa-mezcal/thumb"]')].find(i => i.getBoundingClientRect().width > 0); const g = getComputedStyle(img); const out = [{ el: 'img', rect: JSON.stringify(img.getBoundingClientRect()).slice(0, 70), pos: g.objectPosition }]; let a = img.parentElement; while (a && out.length < 7) { const ga = getComputedStyle(a); const rr = a.getBoundingClientRect(); out.push({ el: (a.getAttribute('data-framer-name') || a.className.toString().split(' ')[0]), h: Math.round(rr.height), top: ga.top, ov: ga.overflow, tr: ga.transform.slice(0, 18) }); a = a.parentElement; } return out; });
console.log(JSON.stringify(r, null, 1)); await b.close();
