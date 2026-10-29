import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com'; const path = process.argv[2] || '/works/';
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1440,960', '--window-position=0,0'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 860 } })).newPage();
await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
await p.evaluate(() => { window.__log = []; const orig = window.scrollTo.bind(window); window.scrollTo = function (...a) { window.__log.push({ t: performance.now() | 0, k: 'scrollTo', a: JSON.stringify(a).slice(0, 40), who: (new Error().stack || '').split('\n').slice(2, 4).join('<-').replace(/https:\/\/djoteo.com/g, '').slice(0, 160) }); return orig(...a); }; window.addEventListener('scroll', () => window.__log.push({ t: performance.now() | 0, k: 'scroll', y: Math.round(scrollY * 10) / 10 }), { passive: true });
  new MutationObserver(l => { for (const m of l) { const e = m.target.nodeType === 3 ? m.target.parentElement : m.target; window.__log.push({ t: performance.now() | 0, k: 'mut', el: (e.getAttribute('data-framer-name') || e.className.toString().slice(0, 25)) + '|' + m.type + '|' + (m.attributeName || ''), v: m.type === 'attributes' ? (e.getAttribute(m.attributeName) || '').slice(0, 60) : '' }); } }).observe(document.documentElement, { attributes: true, childList: true, subtree: true, characterData: true });
  window.__sample = []; setInterval(() => { const h = document.querySelector('footer h1, footer h2, footer .framer-text'); const r = h ? h.getBoundingClientRect() : { top: 0 }; window.__sample.push([performance.now() | 0, Math.round(scrollY * 10) / 10, document.documentElement.scrollHeight, Math.round(r.top * 10) / 10, innerHeight]); }, 50); });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
await p.evaluate(y => window.scrollTo(0, y), total - 860 - 1500); await p.waitForTimeout(600);
for (let i = 0; i < 14; i++) { await p.mouse.move(700, 500 + i * 20); await p.mouse.wheel(0, 150); await p.waitForTimeout(60); }
await p.waitForTimeout(1500);
for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); } await p.waitForTimeout(1200);
await p.evaluate(() => { window.__log = []; window.__sample = []; });
await p.mouse.move(900, 780); await p.waitForTimeout(3000);   // parked over the nav
const r = await p.evaluate(() => ({ log: window.__log, sample: window.__sample }));
const ys = r.sample.map(s => s[1]); const tops = r.sample.map(s => s[3]); const hs = r.sample.map(s => s[2]);
console.log('parked 3s: samples', r.sample.length, 'scrollY min/max', Math.min(...ys), Math.max(...ys), '| headline top min/max', Math.min(...tops), Math.max(...tops), '| docHeight min/max', Math.min(...hs), Math.max(...hs), '| innerHeight', r.sample[0][4]);
console.log('scroll events', r.log.filter(x => x.k === 'scroll').length, 'scrollTo calls', r.log.filter(x => x.k === 'scrollTo').length, 'mutations', r.log.filter(x => x.k === 'mut').length);
const by = {}; for (const x of r.log.filter(x => x.k === 'mut')) by[x.el] = (by[x.el] || 0) + 1; console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6));
for (const x of r.log.filter(x => x.k === 'scrollTo').slice(0, 3)) console.log('scrollTo', x.a, x.who);
console.log('sample head:', r.sample.slice(0, 12).map(s => s[1] + '/' + s[3]).join(' '));
await b.close();
