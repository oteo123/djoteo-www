import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const b = await chromium.launch();
for (let run = 1; run <= 3; run++) for (const [w, h] of [[810, 1080], [1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const msgs = [];
  p.on('console', m => { const t = m.text(); if (/recoverable|Minified React|hydrat/i.test(t)) msgs.push(t.slice(0, 160)); });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  console.log(`run ${run} ${w}px: ${msgs.length} messages` + (msgs[0] ? ' | ' + msgs[0] : ''));
  await ctx.close();
}
await b.close();
