import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright'); const sharp = require('sharp');
const BASE = process.env.BASE || 'https://djoteo.com';
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1440,960', '--window-position=0,0'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
async function capture(label, ms) { const frames = []; const h = async e => { frames.push({ d: e.data, off: e.metadata.scrollOffsetY, t: e.metadata.timestamp }); await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {}); }; cdp.on('Page.screencastFrame', h); await cdp.send('Page.startScreencast', { format: 'png', quality: 100, maxWidth: 2880, maxHeight: 1720, everyNthFrame: 1 }); await p.waitForTimeout(ms); await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', h);
  let changed = 0, max = 0, worst = -1; for (let i = 1; i < frames.length; i++) { const A = await sharp(Buffer.from(frames[i - 1].d, 'base64')).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(Buffer.from(frames[i].d, 'base64')).raw().toBuffer({ resolveWithObject: true }); if (A.data.length !== B.data.length) continue; let n = 0; for (let k = 0; k < A.data.length; k += A.info.channels) if (Math.abs(A.data[k] - B.data[k]) > 24 || Math.abs(A.data[k + 1] - B.data[k + 1]) > 24) n++; if (n > 100) changed++; if (n > max) { max = n; worst = i; } }
  const offs = [...new Set(frames.map(f => Math.round(f.off)))]; console.log(`${label}: frames ${frames.length} in ${ms}ms, changed ${changed}, max ${max}px, scrollOffsets ${offs.slice(0, 6).join(',')}`);
  if (worst > 0 && max > 100) { fs.writeFileSync(`/tmp/h4_${label}_a.png`, Buffer.from(frames[worst - 1].d, 'base64')); fs.writeFileSync(`/tmp/h4_${label}_b.png`, Buffer.from(frames[worst].d, 'base64')); } }
await p.goto(BASE + '/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.mouse.move(700, 30); await p.waitForTimeout(2500);
await p.mouse.move(900, 780); await p.waitForTimeout(800); await capture('park-on-nav-row-no-sweep', 2000);
for (let i = 0; i < 30; i++) { await p.mouse.move(100 + (i * 43) % 1240, 120 + (i * 37) % 700); await p.waitForTimeout(60); } await p.mouse.move(900, 780); await p.waitForTimeout(300); await capture('sweep-then-park-on-nav-row', 2000);
await p.mouse.move(700, 30); await p.waitForTimeout(1500); await capture('park-on-header-after', 2000);
for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); } await capture('right-after-overscroll', 2500);
await p.evaluate(y => window.scrollTo(0, y), 1000); await p.waitForTimeout(800);
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 120 - i * 2); await p.waitForTimeout(16); } await capture('inertia-wheel-into-bottom', 2500);
await p.mouse.move(640, 600); await p.waitForTimeout(300); await capture('park-over-figure', 2000);
await p.mouse.move(165, 820); await p.waitForTimeout(300); await capture('park-over-social', 2000);
await b.close();
