import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch();
for (const path of ['/works/', '/about']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  await p.goto('http://127.0.0.1:8765' + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  for (const sel of ['footer [data-framer-name="Middle image"]']) {
    let { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: sel }); const vis = []; for (const id of nodeIds) { const bm = await cdp.send('DOM.getBoxModel', { nodeId: id }).catch(() => null); if (bm) vis.push(id); } nodeIds = vis; if (!nodeIds.length) { console.log(path, sel, 'none'); continue; }
    const ms = await cdp.send('CSS.getMatchedStylesForNode', { nodeId: nodeIds[0] });
    const rules = (ms.matchedCSSRules || []).map(m => m.rule).filter(r => r.origin === 'regular').map(r => (r.media && r.media.length ? '@' + r.media.map(x => x.text).join(',') + ' ' : '') + r.selectorList.text.slice(0, 70) + ' {' + r.style.cssText.slice(0, 110) + '}');
    const box = await p.evaluate(s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }, sel);
    console.log('##', path, sel, box); for (const r of rules) console.log('   ', r);
  }
  await ctx.close();
}
await b.close();
