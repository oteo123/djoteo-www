import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
await p.goto('http://127.0.0.1:8765/rentals', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
const r = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => /Speakers/.test(e.textContent) && e.children.length > 2 && e.getBoundingClientRect().width > 300 && e.scrollWidth > e.clientWidth + 2).map(e => ({ tag: e.tagName, cls: e.className, sw: e.scrollWidth, cw: e.clientWidth, pos: getComputedStyle(e).position, ov: getComputedStyle(e).overflowX, kids: e.children.length })).slice(0, 4));
console.log(JSON.stringify(r)); await b.close();
