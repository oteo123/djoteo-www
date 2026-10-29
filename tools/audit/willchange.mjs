import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const path of ['/', '/works/casa-mezcal/']) {
  await p.goto('https://djoteo.com' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const els = [...document.querySelectorAll('[style*="will-change"]')].filter(e => getComputedStyle(e).willChange !== 'auto'); const g = { textOnly: [], media: [], other: [] };
    for (const e of els) { const hasMedia = !!e.querySelector('img,video,canvas,svg'); const hasText = (e.textContent || '').trim().length > 0; const d = e.tagName.toLowerCase() + '[' + (e.getAttribute('data-framer-name') || e.getAttribute('data-framer-component-type') || e.className.toString().split(' ')[0]) + '] wc=' + getComputedStyle(e).willChange + ' tr=' + getComputedStyle(e).transform.slice(0, 20) + ' op=' + getComputedStyle(e).opacity + ' inFooter=' + !!e.closest('footer');
      (hasMedia ? g.media : hasText ? g.textOnly : g.other).push(d); }
    return { total: els.length, textOnly: g.textOnly.length, media: g.media.length, other: g.other.length, textSamples: g.textOnly.slice(0, 10), mediaSamples: g.media.slice(0, 8), otherSamples: g.other.slice(0, 5) }; });
  console.log('###', path, JSON.stringify(r, null, 1));
}
await b.close();
