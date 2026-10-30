import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const path of ['/works/', '/about', '/residencies', '/booking']) {
  await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const a = [...document.querySelectorAll('[data-framer-name="Desktop"] a[href="/about"]')].find(e => e.getBoundingClientRect().width > 0); const t = a && [...a.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim()); const g = t && getComputedStyle(t); const hdr = document.querySelector('.framer-ca1k8a-container').getBoundingClientRect(); return { font: g && g.fontSize + ' ' + g.fontFamily.split(',')[0] + ' ' + g.lineHeight, tag: t && t.tagName + '.' + t.className.toString().slice(0, 60), rootFs: getComputedStyle(document.documentElement).fontSize, hdrH: hdr.height }; });
  console.log(path, JSON.stringify(r));
}
await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
const o = await p.evaluate(() => { const sec = document.querySelector('[data-framer-name="About me"]'); const pill = [...sec.querySelectorAll('a')].find(a => /Full Story/.test(a.textContent)); const word = [...sec.querySelectorAll('h1,h2,h3,p')].filter(e => /Decks/.test(e.textContent)).pop(); const R = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }; return { pill: pill && R(pill), word: word && R(word), pillParent: pill && pill.parentElement.className, wordTag: word && word.tagName }; });
console.log('about-me', JSON.stringify(o));
await b.close();
