import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const res = {};
for (const path of ['/works/', '/about']) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://127.0.0.1:8765' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  res[path] = await p.evaluate(() => { const f = [...document.querySelectorAll('footer[data-framer-name="Footer"]')].find(e => e.getBoundingClientRect().height > 0); const fr = f.getBoundingClientRect(); const out = []; const walk = (e, d) => { if (d > 9) return; const r = e.getBoundingClientRect(); const g = getComputedStyle(e); out.push({ k: '  '.repeat(d) + (e.getAttribute('data-framer-name') || e.tagName.toLowerCase()) + '.' + e.className.toString().split(' ')[0], v: `${Math.round(r.left - fr.left)},${Math.round(r.top - fr.top)} ${Math.round(r.width)}x${Math.round(r.height)} ${g.display} ${g.position}` }); for (const c of e.children) walk(c, d + 1); }; walk(f, 0); return out; });
  await p.context().close();
}
const A = res['/works/'], B = res['/about'];
for (let i = 0; i < Math.max(A.length, B.length); i++) { const a = A[i] || { k: '-', v: '-' }, c = B[i] || { k: '-', v: '-' }; if (a.k !== c.k || a.v !== c.v) console.log((a.k + ' ' + a.v).padEnd(80), '| ' + c.k.trim() + ' ' + c.v); }
await b.close();
