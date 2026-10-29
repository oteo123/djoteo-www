import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
const r = await p.evaluate(() => { const h = document.querySelector('.framer-ca1k8a-container'); const menu = h.querySelector('[data-framer-name="Menu"]'); return { html: h.outerHTML, menu: menu ? menu.outerHTML.slice(0, 500) : 'none', variants: [...h.querySelectorAll('.ssr-variant')].map(v => v.className + ' h=' + v.getBoundingClientRect().height) }; });
fs.writeFileSync('/Users/alecpontes/code/djoteo-www/tools/chrome/header-phone.html', r.html); console.log('phone header', r.html.length, '| variants', r.variants.join(' ; '), '\nmenu:', r.menu.replace(/\s+/g, ' ').slice(0, 300));
await b.close();
