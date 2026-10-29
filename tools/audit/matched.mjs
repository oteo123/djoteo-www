import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
await p.goto('http://127.0.0.1:8765/works/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
const doc = await cdp.send('DOM.getDocument', { depth: -1 });
async function rulesFor(selector, props) {
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector }); let picked = null;
  for (const id of nodeIds) { const { model } = await cdp.send('DOM.getBoxModel', { nodeId: id }).catch(() => ({ model: null })); if (model && model.width > 0) { picked = id; break; } }
  if (!picked && nodeIds[0]) picked = nodeIds[0]; if (!picked) return console.log(selector, 'not found');
  const ms = await cdp.send('CSS.getMatchedStylesForNode', { nodeId: picked }); const out = [];
  for (const m of ms.matchedCSSRules || []) { const r = m.rule; const hit = (r.style.cssProperties || []).filter(cp => props.includes(cp.name) && !cp.disabled); if (hit.length) out.push(r.selectorList.text.slice(0, 90) + ' { ' + hit.map(cp => cp.name + ':' + cp.value).join('; ') + ' } [' + (r.origin) + (r.media && r.media.length ? ' @' + r.media.map(x => x.text).join(' ') : '') + ']'); }
  const inl = ms.inlineStyle && ms.inlineStyle.cssProperties.filter(cp => props.includes(cp.name)).map(cp => cp.name + ':' + cp.value).join('; ');
  console.log('##', selector, inl ? '| inline: ' + inl : ''); for (const o of out.slice(0, 8)) console.log('   ', o);
}
await rulesFor('.framer-ca1k8a-container', ['height', 'min-height', 'position', 'top', 'z-index']);
await rulesFor('[data-framer-name="Available"]', ['display', 'visibility', 'opacity', 'width']);
await rulesFor('[data-framer-name="Available for bookings Inquire"]', ['display', 'visibility', 'width']);
await rulesFor('[data-framer-name="Desktop"] [data-framer-name="Links"]', ['display', 'flex-direction', 'gap', 'grid-template-columns', 'grid-auto-flow', 'align-items']);
await rulesFor('body', ['font-size', 'background-color', 'margin']);
await rulesFor('html', ['font-size']);
await b.close();
