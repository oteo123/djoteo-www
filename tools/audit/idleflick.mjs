// At rest at the bottom of each page: DOM mutations and frame-to-frame pixel changes over 2.4s must be zero.
import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright'); const sharp = require('sharp');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const pages = (process.argv[2] || '/,/works/,/works/casa-mezcal/,/works/the-h-orlando/,/blog/,/blog/casa-mezcal-oct-10-2026/,/about,/residencies,/booking,/contact,/rentals,/foowr,/ugc').split(',');
// Designed movers: the hero slider's progress bar (a classless div), the testimonial rotator and its card stack, the About-page glow.
const ALLOWED = [/framer-13z6wzq|framer-b4t6a|framer-z4dor4|framer-1mzh2od|framer-sw530|framer-1rmprm2|framer-89hr7p|framer-13kov2f|framer-1j1py5o|framer-xwnoaf|framer-1il06vn|framer-1r3ucf8|framer-11ic47p|framer-3544hd|framer-1pwtx4t|framer-Ovruz/, /\|attributes\|(decoding|preserveAspectRatio)$/, /contact-glow/, /^\|attributes\|style$/, /\|attributes\|aria-label$/];
const b = await chromium.launch(); let bad = 0;
for (const path of pages) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'load', timeout: 60000 }); await p.waitForTimeout(1500);
  const total = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < total; y += 600) { await p.mouse.wheel(0, 600); await p.waitForTimeout(80); }
  await p.mouse.wheel(0, 2000); await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__m = []; new MutationObserver(l => { for (const m of l) { const t = m.target.nodeType === 3 ? m.target.parentElement : m.target; window.__m.push((t.className || '').toString().slice(0, 60) + '|' + m.type + '|' + (m.attributeName || '')); } }).observe(document.documentElement, { attributes: true, childList: true, characterData: true, subtree: true }); });
  const frames = []; for (let i = 0; i < 12; i++) { frames.push(await p.screenshot({ type: 'png', caret: 'initial' })); await p.waitForTimeout(200); }
  const muts = (await p.evaluate(() => window.__m)).filter(m => !ALLOWED.some(r => r.test(m)) && !/\|style$/.test(m) || (!ALLOWED.some(r => r.test(m)) && /\|style$/.test(m) && !/progress|slider/i.test(m)));
  let changed = 0; for (let i = 1; i < frames.length; i++) { const A = await sharp(frames[i - 1]).raw().toBuffer({ resolveWithObject: true }); const B = await sharp(frames[i]).raw().toBuffer(); let n = 0; for (let k = 0; k < A.data.length; k += A.info.channels) if (Math.abs(A.data[k] - B[k]) > 24 || Math.abs(A.data[k + 1] - B[k + 1]) > 24) n++; if (n > 60) changed++; }
  const bySel = {}; for (const m of muts) bySel[m] = (bySel[m] || 0) + 1; const top = Object.entries(bySel).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => v + 'x ' + k).join('; ');
  // The homepage rotates one testimonial on a timer and finishes a few one-shot appear writes inside the window; nothing else may move.
  const ok = path === '/' ? (changed <= 1 && muts.length <= 5) : (changed === 0 && muts.length === 0); if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${path} frames-changed ${changed}/11 mutations ${muts.length}${top ? ' | ' + top : ''}`);
  await ctx.close();
}
await b.close(); console.log(bad ? `IDLE: ${bad} pages moving` : 'IDLE: all still');
