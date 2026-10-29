// FOUT check on a throttled network: is any text visible before the webfonts are loaded, and does the page reveal within 1.5s of fonts arriving?
import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8765'; let bad = 0;
const b = await chromium.launch();
for (const path of (process.argv[2] || '/,/works/,/works/casa-mezcal/,/blog/,/about,/residencies,/booking,/rentals,/404.html').split(',')) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 1500 * 1024, uploadThroughput: 500 * 1024 });
  await p.addInitScript(() => { window.__samples = []; const start = performance.now(); const tick = () => { try { window.__samples.push([Math.round(performance.now() - start), getComputedStyle(document.documentElement).opacity, document.body ? getComputedStyle(document.body).visibility : 'none', !!(document.body && document.body.innerText && document.body.innerText.trim().length > 20), document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').length : -1, document.fonts ? document.fonts.status : '?']); } catch (e) {} if (performance.now() - start < 6000) setTimeout(tick, 50); }; tick(); });
  await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(3500);
  const s = await p.evaluate(() => window.__samples);
  const firstVisible = s.find(x => x[3] && x[1] !== '0' && x[2] !== 'hidden'); const fontsReady = s.find(x => x[5] === 'loaded' && x[4] > 0); const readyIdx = s.findIndex(x => x[5] === 'loaded' && x[4] > 0); const visibleBeforeFonts = s.filter((x, i) => (readyIdx < 0 || i < readyIdx) && x[3] && x[1] !== '0' && x[2] !== 'hidden');
  const final = s.at(-1); // One sample is the 50ms tick on which the status flips; anything more is a real swap in front of the visitor.
  const ok = visibleBeforeFonts.length <= 1 && final && final[1] !== '0' && final[2] !== 'hidden';
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${path} text-visible@${firstVisible ? firstVisible[0] + 'ms' : 'never'} fonts-ready@${fontsReady ? fontsReady[0] + 'ms' : 'never'} visible-before-fonts=${visibleBeforeFonts.length} final=${final ? 'opacity ' + final[1] + ' body ' + final[2] + ' faces ' + final[4] : '-'}`);
  await ctx.close();
}
await b.close(); console.log(bad ? `FOUT: ${bad} pages show fallback fonts first` : 'FOUT: none');
