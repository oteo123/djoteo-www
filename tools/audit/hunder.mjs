import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
console.log(await p.evaluate(() => { const e = [...document.querySelectorAll('*')].filter(x => x.children.length === 0 && x.textContent.trim() === 'The H Orlando' && x.getBoundingClientRect().width > 0)[0]; let a = e, out = []; while (a && out.length < 6) { const g = getComputedStyle(a); out.push(a.tagName + '.' + a.className.toString().split(' ').slice(0, 2).join('.') + ' deco=' + g.textDecorationLine + ' var=' + g.getPropertyValue('--framer-link-text-decoration') + ' inline=' + (a.getAttribute('style') || '').slice(0, 60)); a = a.parentElement; } return out.join('\n'); }));
await b.close();
