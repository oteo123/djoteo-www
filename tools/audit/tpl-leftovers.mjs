import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com';
const pages = ['/', '/works/', '/works/debonair-supper-club/', '/works/casa-mezcal/', '/works/the-h-orlando/', '/works/helena-modern-riviera/', '/works/ava-mediterraegean/', '/blog/', '/blog/casa-mezcal-oct-10-2026/', '/blog/casa-mezcal-oct-3-2026/', '/blog/opening-for-mochakk-sept-12-2026/', '/blog/ava-mm-lounge-july-6-2024/'];
const bad = /Mandala|marketing agency|website redesign|Bima|Lesmana|case stud|next big things|Featured Works|All Works|Archives|Works\b|Mixes\b|DJ OTEO|OTEO\b|lorem|Velox|polar\.sh|Rooms Rooms/;
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [810, 1080], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  for (const path of pages) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(700);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h * 0.8) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(80); }
    const hits = await p.evaluate(re => { const out = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const rx = new RegExp(re, 'g'); while ((n = walker.nextNode())) { const t = n.nodeValue; if (!t || !t.trim()) continue; const el = n.parentElement; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && parseFloat(cs.opacity) > 0.05; let m; rx.lastIndex = 0; while ((m = rx.exec(t))) { out.push({ visible, text: t.trim().slice(0, 90), match: m[0], el: el.tagName.toLowerCase() + '[' + (el.getAttribute('data-framer-name') || el.className.toString().split(' ')[0]) + ']', y: Math.round(r.top + scrollY) }); } } return out; }, bad.source);
    const vis = hits.filter(h => h.visible);
    if (hits.length) console.log(`${w}px ${path} visible=${vis.length} hidden=${hits.length - vis.length}` + (vis.length ? '\n   ' + vis.slice(0, 8).map(h => `[${h.match}] @${h.y} ${h.el}: ${h.text}`).join('\n   ') : ''));
  }
  await ctx.close();
}
await b.close();
