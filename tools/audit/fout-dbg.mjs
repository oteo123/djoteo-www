import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
p.on('pageerror', e => console.log('pageerror', String(e).slice(0, 120)));
await p.addInitScript(() => { window.__samples = []; try { const start = performance.now(); const tick = () => { try { window.__samples.push([Math.round(performance.now() - start), getComputedStyle(document.documentElement).opacity, document.body ? getComputedStyle(document.body).visibility : 'none', !!(document.body && document.body.innerText && document.body.innerText.trim().length > 20), document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').length : -1, document.fonts ? document.fonts.status : '?']); } catch (e) { window.__samples.push(['err', String(e).slice(0, 60)]); } if (performance.now() - start < 6000) setTimeout(tick, 50); }; tick(); } catch (e) { window.__initErr = String(e); } });
await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'load' }); await p.waitForTimeout(2000);
console.log(await p.evaluate(() => ({ type: typeof window.__samples, len: window.__samples && window.__samples.length, err: window.__initErr, first: window.__samples && window.__samples.slice(0, 4), last: window.__samples && window.__samples.slice(-2) })));
await b.close();
