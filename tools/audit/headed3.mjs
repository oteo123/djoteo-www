import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright'); const sharp = require('sharp');
const BASE = process.env.BASE || 'https://djoteo.com';
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1440,960', '--window-position=0,0'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 860 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
async function run(path, mode) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  if (mode === 'jump') { await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); }
  else { await p.evaluate(y => window.scrollTo(0, y), total - 860 - 1200); await p.waitForTimeout(500); for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(60); } if (mode === 'overscroll') { for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); } } }
  await p.mouse.move(700, 30); await p.waitForTimeout(3000);
  const frames = []; const h = async e => { frames.push(e.data); await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {}); }; cdp.on('Page.screencastFrame', h);
  await cdp.send('Page.startScreencast', { format: 'png', quality: 100, maxWidth: 1440, maxHeight: 860, everyNthFrame: 1 }); await p.waitForTimeout(2000); await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', h);
  let changed = 0, max = 0, worst = -1; for (let i = 1; i < frames.length; i++) { const A = await sharp(Buffer.from(frames[i - 1], 'base64')).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(Buffer.from(frames[i], 'base64')).raw().toBuffer({ resolveWithObject: true }); if (A.data.length !== B.data.length) continue; let n = 0; for (let k = 0; k < A.data.length; k += A.info.channels) if (Math.abs(A.data[k] - B.data[k]) > 24 || Math.abs(A.data[k + 1] - B.data[k + 1]) > 24) n++; if (n > 100) changed++; if (n > max) { max = n; worst = i; } }
  if (worst > 0 && max > 100) { fs.writeFileSync(`/tmp/h3_${path.replace(/\W+/g, '_')}_${mode}_a.png`, Buffer.from(frames[worst - 1], 'base64')); fs.writeFileSync(`/tmp/h3_${path.replace(/\W+/g, '_')}_${mode}_b.png`, Buffer.from(frames[worst], 'base64')); }
  console.log(`${path} ${mode}: frames ${frames.length}, changed ${changed}, max ${max}px`);
}
await run('/works/', 'jump'); await run('/works/', 'wheel'); await run('/works/', 'overscroll'); await run('/residencies', 'wheel'); await run('/404.html', 'wheel');
await b.close();
