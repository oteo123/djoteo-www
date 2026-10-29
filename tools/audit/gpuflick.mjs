// Real Chrome (headless=new, GPU/Metal): record frames while scrolling into the bottom and after it settles.
import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright'); const sharp = require('sharp');
const BASE = process.env.BASE || 'https://djoteo.com'; const pages = (process.argv[2] || '/,/works/').split(',');
const W = Number(process.env.W || 1440), H = Number(process.env.H || 900);
const b = await chromium.launch({ channel: 'chrome', args: ['--headless=new'] });
async function diff(a, c) { const A = await sharp(a).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(c).raw().toBuffer(); let n = 0, sum = 0; const ch = A.info.channels; for (let k = 0; k < A.data.length; k += ch) { const d = Math.abs(A.data[k] - B[k]) + Math.abs(A.data[k + 1] - B[k + 1]) + Math.abs(A.data[k + 2] - B[k + 2]); if (d > 48) n++; sum += d; } return { px: n, mean: (sum / (A.data.length / ch) / 3).toFixed(3) }; }
for (const path of pages) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const renderer = await p.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl'); const e = gl && gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL).slice(0, 40) : '?'; });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const rounds = [];
  for (let round = 1; round <= 3; round++) {
    await p.evaluate(y => window.scrollTo(0, y), total - H - 1600); await p.waitForTimeout(900);
    const frames = [], ys = [];
    for (let i = 0; i < 16; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(40); frames.push(await p.screenshot({ type: 'png' })); ys.push(await p.evaluate(() => scrollY)); }
    for (let i = 0; i < 14; i++) { await p.waitForTimeout(90); frames.push(await p.screenshot({ type: 'png' })); ys.push(await p.evaluate(() => scrollY)); }
    const settled = []; let first = -1;
    for (let i = 1; i < frames.length; i++) { if (ys[i] !== ys[i - 1]) continue; if (first < 0) first = i; const d = await diff(frames[i - 1], frames[i]); if (d.px > 150) { settled.push(`f${i}:${d.px}px/${d.mean}`); if (round === 1 && settled.length === 1) { await sharp(frames[i - 1]).toFile(`/tmp/gpu_${path.replace(/\W+/g, '_')}_pre.png`); await sharp(frames[i]).toFile(`/tmp/gpu_${path.replace(/\W+/g, '_')}_post.png`); } } }
    const late = first >= 0 ? await diff(frames[first], frames[frames.length - 1]) : null;
    // Chrome re-rasterises text once right after any wheel gesture (also on the static 404 page). Anything that still changes 600ms+ after the stop, or a change bigger than the raster signature, is the site's.
    const lateChanges = settled.filter(s => Number(s.match(/^f(\d+)/)[1]) > first + 6 || Number(s.split(':')[1]) > 45000);
    rounds.push(`r${round} bottom=${ys.at(-1)} changes-after-stop=[${settled.join(' ')}] late=[${lateChanges.join(' ')}]${lateChanges.length ? ' SITE-FLICKER' : ''}`);
    if (round === 1 && settled.length) { await sharp(frames[first]).toFile(`/tmp/gpu_${path.replace(/\W+/g, '_')}_a.png`); await sharp(frames[frames.length - 1]).toFile(`/tmp/gpu_${path.replace(/\W+/g, '_')}_b.png`); }
  }
  console.log(`### ${path} [${renderer}]\n   ` + rounds.join('\n   '));
  await ctx.close();
}
await b.close();
