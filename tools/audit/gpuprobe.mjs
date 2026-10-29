import { createRequire } from 'node:module';
const require = createRequire('/Users/alecpontes/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules/');
const { chromium } = require('playwright');
const name = process.argv[2]; const opts = JSON.parse(process.argv[3] || '{}');
const t = setTimeout(() => { console.log(name, 'TIMEOUT'); process.exit(2); }, 60000);
try { const b = await chromium.launch(opts); const p = await b.newPage(); await p.setContent('<canvas id=c></canvas>');
  const r = await p.evaluate(() => { const gl = document.getElementById('c').getContext('webgl'); if (!gl) return 'no-webgl'; const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'no-ext'; });
  console.log(name, '=>', r); await b.close(); } catch (e) { console.log(name, 'FAILED', String(e).slice(0, 100)); }
clearTimeout(t); process.exit(0);
