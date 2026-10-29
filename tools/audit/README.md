# djoteo.com audit gate

`tools/audit/gate.sh` runs every check against the local build (`python3 tools/audit/serve.py 8765`) and must print `GATE PASS` before a push. After the GitHub Pages build, run it again with `BASE=https://djoteo.com`.

Checks (each is a standalone script, Playwright from `~/Dropbox/OTEO code/DJOTEO-REDESIGN/node_modules`):
- `hydration.mjs` – React hydration errors (#418/#422/#423/#425), uncaught errors and template-CMS requests on the 12 Framer pages at 1440/810/390.
- `links.mjs` – every internal link fetches 200, every rendered image decodes, no duplicate ids (the template's own `#main` pair is allowed), no console errors, on all 22 pages.
- `tpl-leftovers.mjs` – no visible Lesmana/Mandala/Bima/Works/Mixes/“DJ OTEO” text at any width.
- `idleflick.mjs` – at rest at the bottom of each page: DOM mutations and frame-to-frame pixel changes must both be zero (the slider progress bar and the About glow are the allowed movers).
- `gpuflick.mjs` – real Google Chrome, `--headless=new`, Apple Metal GPU: frames while wheeling into the bottom and after settling. Chrome itself re-rasterises text once after any wheel gesture (also on the static 404 page); anything larger than that, or any change that keeps going, is the site's fault.
- `fout.mjs` – on a throttled connection, no page may show text before its webfonts are loaded (the visible "font change"); every page must reveal.
- `faces.mjs` – face detection on every rendered image mapped through object-fit and ancestor clipping at three scroll positions; a face outside its visible window is a failure.
- `layers.mjs`, `footeranim.mjs`, `willchange.mjs`, `gpuprobe.mjs` – diagnostics used to find the 2026-10 footer replay and layer problems; not part of the gate.

Lessons that shaped this gate (2026-10-27 → 29): headless Chromium composites in software and cannot show GPU flicker; `will-change`, `backdrop-filter` and replaying entrance effects were all invisible to it. Never keep tooling in the session scratchpad; it is wiped between sessions.
