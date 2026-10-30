import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://djoteo.com/', { waitUntil: 'load' }); await p.waitForTimeout(3000);
console.log(await p.evaluate(() => { const e = document.querySelector('.framer-1pwtx4t, .framer-3544hd'); if (!e) return 'none'; let a = e, c = []; while (a && c.length < 6) { c.push(a.getAttribute('data-framer-name') || a.className.toString().slice(0, 30)); a = a.parentElement; } return c.join(' < ') + ' | section: ' + (e.closest('section') && e.closest('section').getAttribute('data-framer-name')); }));
await b.close();
