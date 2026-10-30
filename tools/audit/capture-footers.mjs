import { createRequire } from 'node:module'; import fs from 'node:fs';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const [w, h, name] of [[390, 844, 'phone'], [1000, 900, 'tablet']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500 })).newPage();
  await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(2000);
  const r = await p.evaluate(() => { const f = document.querySelector('footer[data-framer-name="Footer"]'); return { html: f.outerHTML, cls: f.className }; });
  fs.writeFileSync(`/Users/alecpontes/code/djoteo-www/tools/chrome/footer-${name}.html`, r.html); console.log(name, r.html.length, r.cls);
  await p.context().close();
}
await b.close();
