// Real on-screen Chrome window: screencast the bottom of the page while scrolling, hovering, and bouncing; diff frames.
import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright'); const sharp = require('sharp');
const BASE = process.env.BASE || 'https://djoteo.com'; const path = process.argv[2] || '/works/';
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1440,960', '--window-position=0,0'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 860 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const frames = []; cdp.on('Page.screencastFrame', async e => { frames.push({ t: Date.now(), data: e.data, meta: e.metadata }); await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {}); });
await cdp.send('Page.startScreencast', { format: 'png', quality: 100, maxWidth: 1440, maxHeight: 860, everyNthFrame: 1 });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
await p.evaluate(y => window.scrollTo(0, y), total - 860 - 1500); await p.waitForTimeout(800);
const mark = []; const stamp = n => mark.push([n, Date.now(), frames.length]);
stamp('wheel-in'); for (let i = 0; i < 14; i++) { await p.mouse.move(700, 500 + i * 20); await p.mouse.wheel(0, 150); await p.waitForTimeout(60); }
stamp('settle'); await p.waitForTimeout(1500);
stamp('bounce'); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); } await p.waitForTimeout(1200);
stamp('hover-sweep'); for (let i = 0; i < 30; i++) { await p.mouse.move(100 + (i * 43) % 1240, 120 + (i * 37) % 700); await p.waitForTimeout(60); }
stamp('park'); await p.waitForTimeout(1500);
stamp('end'); await cdp.send('Page.stopScreencast');
console.log('frames captured', frames.length, 'phases', mark.map(m => m[0] + '@' + m[2]).join(' '));
let big = []; for (let i = 1; i < frames.length; i++) { const A = await sharp(Buffer.from(frames[i - 1].data, 'base64')).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(Buffer.from(frames[i].data, 'base64')).raw().toBuffer({ resolveWithObject: true }); if (A.info.width !== B.info.width || A.info.height !== B.info.height) continue; let n = 0; for (let k = 0; k < A.data.length; k += A.info.channels) if (Math.abs(A.data[k] - B.data[k]) > 24 || Math.abs(A.data[k + 1] - B.data[k + 1]) > 24) n++; const phase = mark.filter(m => m[2] <= i).at(-1)?.[0]; big.push({ i, phase, n, t: frames[i].t - frames[0].t }); }
const byPhase = {}; for (const x of big) { byPhase[x.phase] = byPhase[x.phase] || { frames: 0, changed: 0, max: 0 }; byPhase[x.phase].frames++; if (x.n > 100) byPhase[x.phase].changed++; byPhase[x.phase].max = Math.max(byPhase[x.phase].max, x.n); }
console.log(JSON.stringify(byPhase));
// Save the biggest change in settle/park phases for viewing
for (const ph of ['settle', 'park', 'bounce']) { const worst = big.filter(x => x.phase === ph).sort((a, b) => b.n - a.n)[0]; if (worst && worst.n > 100) { fs.writeFileSync(`/tmp/headed_${ph}_a.png`, Buffer.from(frames[worst.i - 1].data, 'base64')); fs.writeFileSync(`/tmp/headed_${ph}_b.png`, Buffer.from(frames[worst.i].data, 'base64')); console.log(ph, 'worst frame', worst.i, worst.n + 'px at', worst.t + 'ms'); } }
await b.close();
