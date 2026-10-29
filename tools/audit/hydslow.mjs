import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com'; const b = await chromium.launch();
for (const [w, h] of [[810, 1080], [1440, 900], [390, 844]]) for (const rate of [1, 6]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate }); const msgs = [];
  p.on('console', m => { const t = m.text(); if (/recoverable|Minified React|hydrat|#4\d\d/i.test(t)) msgs.push(t.replace(/\s+/g, ' ').slice(0, 220)); });
  await p.goto(BASE + (process.argv[2] || '/'), { waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(6000);
  console.log(`${w}px cpu x${rate}: ${msgs.length} messages`); for (const m of msgs.slice(0, 3)) console.log('   ', m);
  await ctx.close();
}
await b.close();
