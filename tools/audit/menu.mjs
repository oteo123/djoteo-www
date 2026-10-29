import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await p.goto((process.env.BASE || 'http://127.0.0.1:8765') + '/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const toggle = await p.evaluate(() => { const c = [...document.querySelectorAll('[data-framer-name*="enu"], [aria-label*="enu"], button')].find(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().top < 80 && e.getBoundingClientRect().left > 250); return c ? (c.getAttribute('data-framer-name') || c.tagName) + ' @' + JSON.stringify(c.getBoundingClientRect()).slice(0, 60) : null; });
console.log('toggle:', toggle);
const t0 = Date.now();
await p.tap('[data-framer-name="Phone Open"], [data-framer-name="Menu"], [data-framer-name="Hamburger"], [aria-label*="enu"]').catch(async () => { await p.mouse.click(372, 28); });
const samples = [];
for (let i = 0; i < 16; i++) { await p.waitForTimeout(100); const s = await p.evaluate(() => { const nav = document.querySelector('nav[data-framer-name="Phone Open"]') || document.querySelector('[data-framer-name="Phone Open"]'); if (!nav) return 'no-nav'; const links = [...nav.querySelectorAll('a[href]')]; const vis = links.filter(a => { const r = a.getBoundingClientRect(); const g = getComputedStyle(a); return r.width > 0 && r.height > 0 && parseFloat(g.opacity) > 0.5 && g.visibility !== 'hidden'; }); const low = links.filter(a => parseFloat(getComputedStyle(a).opacity) <= 0.5).map(a => a.textContent.trim().slice(0, 10) + ':' + getComputedStyle(a).opacity + '/' + (a.closest('[style*="opacity"]') ? a.closest('[style*="opacity"]').style.opacity : '-')); return `${vis.length}/${links.length} visible` + (low.length ? ' low=' + low.slice(0, 3).join(',') : ''); }); samples.push((Date.now() - t0) + 'ms ' + s); }
console.log(samples.join('\n'));
await p.screenshot({ path: '/tmp/menu_m.png' }); await b.close();
