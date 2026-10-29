import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com'; const path = process.argv[2] || '/works/';
const b = await chromium.launch({ channel: 'chrome', args: ['--headless=new'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable');
let layers = []; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
await p.evaluate(y => window.scrollTo(0, y), total - 900 - 1600); await p.waitForTimeout(800);
async function snap(tag) { await p.waitForTimeout(50); const out = []; for (const l of layers) { let desc = ''; if (l.backendNodeId) { try { const d = await cdp.send('DOM.describeNode', { backendNodeId: l.backendNodeId }); const n = d.node; const attrs = n.attributes || []; const get = k => { const i = attrs.indexOf(k); return i >= 0 ? attrs[i + 1] : ''; }; desc = n.nodeName.toLowerCase() + '#' + get('id') + '[' + (get('data-framer-name') || (get('class') || '').split(' ')[0]) + ']'; } catch { desc = '?'; } } out.push({ id: l.layerId, desc, w: l.width, h: l.height, paint: l.paintCount, draws: l.drawsContent, tr: l.transform ? l.transform.map(v => +v.toFixed(2)).slice(12, 14).join(',') : '-' }); } return out; }
for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(40); }
const moving = await snap('moving');
await p.waitForTimeout(1200);
const settled = await snap('settled');
const byId = Object.fromEntries(moving.map(l => [l.id, l]));
console.log('layers moving', moving.length, 'settled', settled.length, 'scrollY', await p.evaluate(() => scrollY));
const repainted = settled.filter(l => byId[l.id] && l.paint > byId[l.id].paint).sort((a, b) => (b.w * b.h) - (a.w * a.h));
console.log('repainted after stop:', repainted.length); for (const l of repainted.slice(0, 12)) console.log('  ', l.desc, l.w + 'x' + l.h, 'paint', byId[l.id].paint, '->', l.paint, 'tr', l.tr);
const gone = moving.filter(l => !settled.find(s => s.id === l.id)); const born = settled.filter(l => !byId[l.id]);
console.log('layers removed:', gone.length, gone.slice(0, 8).map(l => l.desc + ' ' + l.w + 'x' + l.h).join(' | ')); console.log('layers added:', born.length, born.slice(0, 8).map(l => l.desc + ' ' + l.w + 'x' + l.h).join(' | '));
console.log('biggest layers now:'); for (const l of settled.filter(l => l.draws).sort((a, b) => (b.w * b.h) - (a.w * a.h)).slice(0, 8)) console.log('  ', l.desc, l.w + 'x' + l.h, 'paint', l.paint, 'tr', l.tr);
await b.close();
