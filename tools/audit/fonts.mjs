import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'https://djoteo.com';
const b = await chromium.launch({ channel: 'chrome', args: ['--headless=new'] });
for (const path of (process.argv[2] || '/works/,/,/residencies').split(',')) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const fontReq = []; p.on('response', r => { const u = r.url(); if (/\.(woff2?|ttf|otf)(\?|$)/i.test(u) || /font/i.test(r.headers()['content-type'] || '')) fontReq.push({ u: u.replace(BASE, '').slice(0, 90), s: r.status(), t: Date.now() }); });
  const t0 = Date.now(); await p.goto(BASE + path, { waitUntil: 'load' }); const tLoad = Date.now() - t0;
  await p.waitForTimeout(300);
  const early = await p.evaluate(() => [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.style + ' ' + f.status + ' disp=' + f.display));
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(4000);
  const late = await p.evaluate(() => { const faces = [...document.fonts].map(f => ({ k: f.family + ' ' + f.weight + ' ' + f.style, status: f.status, display: f.display })); const used = {}; for (const e of document.querySelectorAll('footer *, h1, h2, h3, p, a, span')) { if (!e.textContent || !e.textContent.trim() || e.children.length > 3) continue; const g = getComputedStyle(e); const fam = g.fontFamily.split(',')[0].replace(/"/g, ''); const key = fam + ' ' + g.fontWeight; used[key] = (used[key] || 0) + 1; } return { faces, used, rules: [...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } }).filter(r => r instanceof CSSFontFaceRule).map(r => r.style.fontFamily + ' ' + r.style.fontWeight + ' disp=' + (r.style.fontDisplay || '-') + ' src=' + (r.style.src || '').slice(0, 70)) }; });
  console.log(`### ${path} load=${tLoad}ms font files=${fontReq.length} (${fontReq.filter(f => f.s !== 200).length} not-200) early-faces=${early.length}`);
  console.log('   font requests timing (ms after start):', fontReq.map(f => (f.t - t0) + (f.s !== 200 ? '!' + f.s : '')).join(' '));
  console.log('   faces status:', Object.entries(late.faces.reduce((a, f) => { a[f.status + '/' + f.display] = (a[f.status + '/' + f.display] || 0) + 1; return a; }, {})).map(([k, v]) => k + ':' + v).join(' '));
  console.log('   families used in text:', Object.entries(late.used).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + '(' + v + ')').join(', '));
  console.log('   @font-face display values:', Object.entries(late.rules.reduce((a, r) => { const d = r.match(/disp=(\S+)/)[1]; a[d] = (a[d] || 0) + 1; return a; }, {})).map(([k, v]) => k + ':' + v).join(' '), '| sample:', late.rules.slice(0, 2).join(' || '));
  const unloaded = late.faces.filter(f => f.status !== 'loaded' && f.status !== 'unloaded'); if (unloaded.length) console.log('   NOT LOADED:', unloaded.map(f => f.k + ':' + f.status).slice(0, 6).join(', '));
  const ext = fontReq.filter(f => !f.u.startsWith('/')); if (ext.length) console.log('   external font hosts:', [...new Set(ext.map(f => f.u.split('/')[2]))].join(', '));
  await ctx.close();
}
await b.close();
