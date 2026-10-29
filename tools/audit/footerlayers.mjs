import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch({ channel: 'chrome', args: ['--headless=new'] }); const ctx = await b.newContext({ viewport: { width: 1440, height: 860 } }); const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable'); let layers = []; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
await p.goto((process.env.BASE || 'https://djoteo.com') + '/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(2000);
const wc = await p.evaluate(() => [...document.querySelectorAll('footer *')].filter(e => getComputedStyle(e).willChange !== 'auto').map(e => (e.getAttribute('data-framer-name') || e.className.toString().split(' ')[0]) + '=' + getComputedStyle(e).willChange + (e.querySelector('img') ? '(img)' : '')));
console.log('footer will-change:', wc.length, wc.slice(0, 12).join(', '));
const out = []; for (const l of layers) { if (!l.backendNodeId || !l.drawsContent) continue; try { const d = await cdp.send('DOM.describeNode', { backendNodeId: l.backendNodeId }); const a = d.node.attributes || []; const g = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : ''; }; out.push({ desc: d.node.nodeName.toLowerCase() + '[' + (g('data-framer-name') || (g('class') || '').split(' ')[0]) + ']', w: l.width, h: l.height, paint: l.paintCount, reasons: (l.compositingReasons || []).join(',') }); } catch {} }
const inFooter = await p.evaluate(() => [...document.querySelectorAll('footer [data-framer-name]')].map(e => e.getAttribute('data-framer-name')));
console.log('layers that draw content:', out.length); for (const l of out.filter(l => l.w * l.h > 50000).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 14)) console.log('  ', l.desc, l.w + 'x' + l.h, 'paint', l.paint, l.reasons.slice(0, 60));
await b.close();
