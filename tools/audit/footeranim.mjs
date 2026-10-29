import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'chrome', args: ['--headless=new'] }); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('https://djoteo.com/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
await p.evaluate(y => window.scrollTo(0, y), total - 900 - 1600); await p.waitForTimeout(800);
await p.evaluate(() => { window.__log = []; const sel = '.framer-1vck9nr-container, .framer-1d4d0yu-container, .framer-123gva8-container, .framer-g029pb-container, .framer-1d77qyi-container'; const targets = [...document.querySelectorAll(sel)]; const d = e => e.tagName.toLowerCase() + '.' + e.className.toString().split(' ')[0] + '[' + (e.getAttribute('data-framer-name') || '') + ']';
  new MutationObserver(l => { for (const m of l) { const e = m.target; window.__log.push({ t: performance.now() | 0, y: scrollY, el: d(e), inside: targets.some(t => t.contains(e)) ? 'child' : 'self', style: (e.getAttribute('style') || '').slice(0, 110) }); } }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
  window.__targets = targets.map(t => ({ el: d(t), style: (t.getAttribute('style') || '').slice(0, 120), kids: [...t.querySelectorAll('*')].slice(0, 4).map(k => d(k) + ' :: ' + (k.getAttribute('style') || '').slice(0, 100)) })); });
console.log(JSON.stringify(await p.evaluate(() => window.__targets.slice(0, 3)), null, 1));
for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(40); }
await p.waitForTimeout(1500);
const log = await p.evaluate(() => window.__log);
const stopT = Math.max(...log.map(x => x.t)); const byEl = {}; for (const x of log) { byEl[x.el] = (byEl[x.el] || 0) + 1; }
console.log('mutations', log.length, 'distinct elements', Object.keys(byEl).length); for (const [k, v] of Object.entries(byEl).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log('  ', v + 'x', k);
const lastY = log.at(-1).y; const after = log.filter(x => x.y === lastY); console.log('after scroll stopped:', after.length, 'writes; samples:'); for (const x of after.filter((x, i) => i % Math.ceil(after.length / 8) === 0)) console.log('   ', x.t, x.el, x.style);
await b.close();
