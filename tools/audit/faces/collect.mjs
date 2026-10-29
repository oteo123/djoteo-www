// Collect every rendered image (>40x40) on each page at two widths, with clip boxes at three scroll positions.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com';
const pages = (process.env.PAGES || '/').split(',');
const out = [];
const b = await chromium.launch();
for (const [W, H, dpr, tag] of (process.env.WIDTHS === 'desktop' ? [[1440, 900, 1, 'desktop']] : process.env.WIDTHS === 'phone' ? [[390, 844, 2, 'phone']] : [[1440, 900, 1, 'desktop'], [390, 844, 2, 'phone']])) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr, isMobile: tag === 'phone', hasTouch: tag === 'phone' });
  const p = await ctx.newPage();
  for (const path of pages) {
    try { await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 90000 }); } catch (e) { out.push({ page: path, width: tag, error: String(e).slice(0, 80) }); continue; }
    await p.waitForTimeout(1500);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += H * 0.7) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
    // enumerate candidates at scroll 0 (document coords)
    const items = await p.evaluate(() => {
      const res = [];
      const slotOf = e => { let a = e; while (a && a !== document.body) { const n = a.getAttribute && a.getAttribute('data-framer-name'); if (n) return n; a = a.parentElement; } const sec = e.closest('section, header, footer, main, article'); if (sec) { const h = sec.querySelector('h1,h2,h3'); return (sec.tagName.toLowerCase()) + (h ? ':' + h.textContent.trim().slice(0, 30) : (sec.className ? '.' + sec.className.toString().split(' ')[0] : '')); } return '?'; };
      const mark = (el, src, kind) => { const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 40) return; const id = 'ia' + res.length; el.setAttribute('data-ia', id); res.push({ id, kind, src, slot: slotOf(el), rect: [r.left, r.top + scrollY, r.width, r.height].map(Math.round), nat: kind === 'img' ? [el.naturalWidth, el.naturalHeight] : null, fit: kind === 'img' ? getComputedStyle(el).objectFit + ' ' + getComputedStyle(el).objectPosition : getComputedStyle(el).backgroundSize + ' ' + getComputedStyle(el).backgroundPosition, alt: kind === 'img' ? (el.getAttribute('alt') || '') : '' }); };
      for (const img of document.querySelectorAll('img')) { if (!img.currentSrc) continue; mark(img, img.currentSrc, 'img'); }
      for (const el of document.querySelectorAll('body *')) { const bg = getComputedStyle(el).backgroundImage; const m = bg && bg.match(/url\("?([^")]+)"?\)/); if (m && !/gradient/.test(bg.split('url')[0])) mark(el, m[1], 'bg'); }
      return res; });
    // for each item, measure clip boxes at three scroll positions
    for (const it of items) {
      const [x, top, w, h] = it.rect; const positions = { centred: Math.max(0, top + h / 2 - H / 2), entered: Math.max(0, top + h - H + 40), leaving: Math.max(0, top - 40) };
      it.clips = {};
      for (const [name, y] of Object.entries(positions)) {
        await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(350);
        it.clips[name] = await p.evaluate(id => { const el = document.querySelector('[data-ia="' + id + '"]'); if (!el) return null; const r = el.getBoundingClientRect(); let clip = [r.left, r.top, r.right, r.bottom]; let a = el.parentElement; while (a && a !== document.documentElement) { const o = getComputedStyle(a); const q = a.getBoundingClientRect(); if (q.width > 0 && q.height > 0 && o.display !== 'contents' && (/(hidden|clip|auto|scroll)/.test(o.overflow + o.overflowX + o.overflowY) || o.clipPath !== 'none')) { clip = [Math.max(clip[0], q.left), Math.max(clip[1], q.top), Math.min(clip[2], q.right), Math.min(clip[3], q.bottom)]; } a = a.parentElement; } clip = [Math.max(clip[0], 0), Math.max(clip[1], 0), Math.min(clip[2], innerWidth), Math.min(clip[3], innerHeight)]; return { scrollY, el: [r.left, r.top, r.width, r.height].map(Math.round), clip: clip.map(Math.round), vis: clip[2] > clip[0] && clip[3] > clip[1] }; }, it.id);
      }
      // screenshot the clip box at centred position
      await p.evaluate(y => window.scrollTo(0, y), positions.centred); await p.waitForTimeout(300);
      const c = it.clips.centred; if (c && c.vis) { const [l, t, r, bt] = c.clip; try { await p.screenshot({ path: `clips/${tag}_${path.replace(/\W+/g, '_') || 'home'}_${it.id}.png`, clip: { x: l, y: t, width: Math.max(1, r - l), height: Math.max(1, bt - t) } }); it.shot = `clips/${tag}_${path.replace(/\W+/g, '_') || 'home'}_${it.id}.png`; } catch (e) { it.shotErr = String(e).slice(0, 60); } }
      out.push({ page: path, width: tag, dpr, ...it });
    }
    console.log(tag, path, items.length);
  }
  await ctx.close();
}
await b.close();
fs.writeFileSync(process.env.OUT || 'inventory.json', JSON.stringify(out, null, 1));
console.log('total', out.length);
