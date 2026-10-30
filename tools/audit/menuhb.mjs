import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await p.goto('http://127.0.0.1:8765/about', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const btn = await p.evaluate(() => { const c = [...document.querySelectorAll('[data-oteo-chrome-header] [data-framer-name="Menu"]')].find(e => e.getBoundingClientRect().width > 0); if (!c) return null; const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
console.log('menu button', btn);
if (btn) { await p.touchscreen.tap(btn[0], btn[1]); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/vis/menu_about.png' }); const st = await p.evaluate(() => getComputedStyle(document.querySelector('[data-oteo-chrome-menu]')).display); console.log('menu panel display after tap:', st);
  const link = await p.evaluate(() => { const a = [...document.querySelectorAll('[data-oteo-chrome-menu] a[href="/works"], [data-oteo-chrome-menu] a[href="/works/"]')].find(e => e.getBoundingClientRect().width > 0); if (!a) return null; const r = a.getBoundingClientRect(); return [r.left + 10, r.top + r.height / 2]; });
  if (link) { await Promise.all([p.waitForNavigation({ timeout: 8000 }).catch(() => {}), p.touchscreen.tap(link[0], link[1])]); console.log('after tapping Rooms:', p.url()); } else console.log('Rooms link not visible in menu'); }
await b.close();
