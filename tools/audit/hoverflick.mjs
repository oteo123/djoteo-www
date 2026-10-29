import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright'); const sharp = require('sharp');
const BASE = process.env.BASE || 'https://djoteo.com'; const path = process.argv[2] || '/works/';
const b = await chromium.launch({ channel: 'chrome', args: ['--headless=new'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(2500);
const nav = await p.evaluate(() => { const el = [...document.querySelectorAll('footer [data-framer-name="Links"], footer nav, footer a[href]')].find(e => e.getBoundingClientRect().width > 100 && e.getBoundingClientRect().height > 100) || document.querySelector('footer'); const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
console.log('footer nav rect', nav.map(Math.round));
async function diff(a, c) { const A = await sharp(a).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(c).raw().toBuffer(); let n = 0; for (let k = 0; k < A.data.length; k += A.info.channels) if (Math.abs(A.data[k] - B[k]) > 24 || Math.abs(A.data[k + 1] - B[k + 1]) > 24) n++; return n; }
await p.evaluate(() => { window.__m = []; new MutationObserver(l => { for (const m of l) { const t = m.target.nodeType === 3 ? m.target.parentElement : m.target; window.__m.push((t.getAttribute('data-framer-name') || t.className.toString().slice(0, 30)) + '|' + m.type + '|' + (m.attributeName || '')); } }).observe(document.body, { attributes: true, childList: true, characterData: true, subtree: true }); });
// phase 1: mouse sweeping over footer nav rows for 2s
const frames1 = []; const [x, y, w, h] = nav;
for (let i = 0; i < 20; i++) { await p.mouse.move(x + 20 + (i % 5) * 60, y + (h / 20) * i); await p.waitForTimeout(100); frames1.push(await p.screenshot({ type: 'png' })); }
const m1 = await p.evaluate(() => { const m = window.__m; window.__m = []; return m; });
// phase 2: mouse parked over a row, no movement, 2s
const frames2 = []; for (let i = 0; i < 12; i++) { await p.waitForTimeout(170); frames2.push(await p.screenshot({ type: 'png' })); }
const m2 = await p.evaluate(() => { const m = window.__m; window.__m = []; return m; });
// phase 3: wheel at bottom (overscroll) with mouse over footer
const frames3 = []; for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(80); frames3.push(await p.screenshot({ type: 'png' })); } for (let i = 0; i < 8; i++) { await p.waitForTimeout(150); frames3.push(await p.screenshot({ type: 'png' })); }
const m3 = await p.evaluate(() => window.__m);
async function changed(fr) { let c = 0, big = 0; for (let i = 1; i < fr.length; i++) { const n = await diff(fr[i - 1], fr[i]); if (n > 60) c++; if (n > big) big = n; } return c + '/' + (fr.length - 1) + ' max ' + big + 'px'; }
const top = m => { const by = {}; for (const x of m) by[x] = (by[x] || 0) + 1; return Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => v + 'x ' + k).join('; '); };
console.log('sweep:  frames changed', await changed(frames1), '| mutations', m1.length, '|', top(m1));
console.log('parked: frames changed', await changed(frames2), '| mutations', m2.length, '|', top(m2));
console.log('wheel at bottom over footer: frames changed', await changed(frames3), '| mutations', m3.length, '|', top(m3));
await b.close();
