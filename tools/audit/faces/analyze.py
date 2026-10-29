# Face / quality analysis over inventory.json produced by collect.mjs
import json, os, sys, urllib.request, hashlib, math
import cv2, numpy as np
inv = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'inventory2.json'))
os.makedirs('src', exist_ok=True)
# 0.65: the mirror ball on the Helena night photo scored 0.527 as a 'face'; real faces on these pages score 0.84+
yn = cv2.FaceDetectorYN.create('yunet.onnx', '', (320, 320), 0.65, 0.3, 5000)
def detect(img):
    h, w = img.shape[:2]
    scale = 1.0
    if max(h, w) > 1280:
        scale = 1280 / max(h, w); img = cv2.resize(img, None, fx=scale, fy=scale); h, w = img.shape[:2]
    yn.setInputSize((w, h)); _, f = yn.detect(img)
    out = []
    if f is not None:
        for r in f: out.append(tuple(int(v / scale) for v in r[:4]))
    return out
cache = {}
def fetch(src):
    key = src.split('?')[0].replace('http://127.0.0.1:8765', 'http://127.0.0.1:8765')
    if key in cache: return cache[key]
    fn = 'src/' + hashlib.md5(key.encode()).hexdigest()[:10] + '_' + os.path.basename(key)[:60]
    if not os.path.exists(fn):
        try:
            req = urllib.request.Request(key, headers={'User-Agent': 'Mozilla/5.0'})
            open(fn, 'wb').write(urllib.request.urlopen(req, timeout=30).read())
        except Exception as e:
            cache[key] = None; return None
    img = cv2.imread(fn)
    if img is None:
        # svg or unreadable
        cache[key] = None; return None
    faces = detect(img)
    # keep the largest face (the portrait subject)
    faces.sort(key=lambda f: -f[2] * f[3])
    h, w = img.shape[:2]
    cache[key] = {'file': fn, 'w': w, 'h': h, 'faces': faces[:2], 'img': img}
    return cache[key]

def shown_region(it, clipinfo, info):
    """Map the visible clip box (viewport px) back to source-image pixel region, for object-fit cover/contain or background-size cover."""
    el = clipinfo['el']; ex, ey, ew, eh = el
    cl, ct, cr, cb = clipinfo['clip']
    W, H = info['w'], info['h']
    fit = (it.get('fit') or '').split()[0]
    if it['kind'] == 'img' and fit == 'contain':
        s = min(ew / W, eh / H)
    else:
        s = max(ew / W, eh / H)  # cover (default for bg 'cover'; for img default 'fill' treat as cover approx)
        if it['kind'] == 'img' and fit == 'fill':
            sx, sy = ew / W, eh / H
            def to_src(x, y): return ((x - ex) / sx, (y - ey) / sy)
            return to_src(cl, ct), to_src(cr, cb), (sx, sy, ex, ey, 0, 0)
    dw, dh = W * s, H * s
    # object-position / background-position: '50% 20%' means the slack is split 50/20
    parts = (it.get('fit') or '').split()
    def pct(v, default=0.5):
        try: return float(v.rstrip('%')) / 100 if v.endswith('%') else default
        except Exception: return default
    px = pct(parts[1]) if len(parts) > 1 else 0.5
    py = pct(parts[2]) if len(parts) > 2 else 0.5
    ox, oy = ex + (ew - dw) * px, ey + (eh - dh) * py
    def to_src(x, y): return ((x - ox) / s, (y - oy) / s)
    return to_src(cl, ct), to_src(cr, cb), (s, s, ox, oy, 0, 0)

rows = []
seen_per_page = {}
for it in inv:
    if 'error' in it: rows.append({'page': it['page'], 'width': it['width'], 'verdicts': ['PAGE-ERROR ' + it['error']]}); continue
    verdicts = []; detail = {}
    info = fetch(it['src'])
    key = it['src'].split('?')[0]
    pk = (it['page'], it['width'])
    seen_per_page.setdefault(pk, {}).setdefault(key, 0); seen_per_page[pk][key] += 1
    nat = it.get('nat')
    if it['kind'] == 'img' and nat and nat[0] == 0: verdicts.append('BROKEN')
    if info is None and it['kind'] == 'img' and not key.endswith('.svg'): verdicts.append('UNREADABLE')
    c = it['clips'].get('centred')
    carousel = it.get('slot') == 'Slider'
    if carousel:
        verdicts.append('CAROUSEL (3D rotating hero slide; judged on source framing)')
        if info and info['faces']:
            fx, fy, fw, fh = info['faces'][0]
            if fy < 0.04 * info['h'] or fy + fh > 0.96 * info['h'] or fx < 0.04 * info['w'] or fx + fw > 0.96 * info['w']: verdicts.append(f'CUT-SOURCE face{[fx,fy,fw,fh]} touches the edge of {info["w"]}x{info["h"]}')
        c = None
    elif not c or not c['vis']: verdicts.append('NOT-VISIBLE-CENTRED')
    if info and c and c['vis']:
        # blur: rendered device px vs natural
        ew = c['el'][2] * it['dpr']
        if ew > info['w'] * 1.15: verdicts.append(f"BLURRY (needs {int(ew)}px, has {info['w']}px)")
        # faces
        faces = info['faces']
        if faces:
            fx, fy, fw, fh = faces[0]
            if fy < 0.02 * info['h'] or fy + fh > 0.98 * info['h'] or fx < 0.02 * info['w'] or fx + fw > 0.98 * info['w']: verdicts.append(f'CUT-SOURCE face{[fx,fy,fw,fh]} touches the edge of the file ({info["w"]}x{info["h"]})')
            for pos in ['centred', 'entered', 'leaving']:
                ci = it['clips'].get(pos)
                if not ci or not ci['vis']: continue
                (sx0, sy0), (sx1, sy1), (s, s2, ox, oy, _, _) = shown_region(it, ci, info)
                tol = 4 / s
                inside = fx >= sx0 - tol and fy >= sy0 - tol and fx + fw <= sx1 + tol and fy + fh <= sy1 + tol
                # face box in screen px
                face_screen = [round(ox + fx * s), round(oy + fy * s2), round(fw * s), round(fh * s2)]
                detail[pos] = {'face_screen': face_screen, 'clip': ci['clip'], 'shown_src': [round(sx0), round(sy0), round(sx1), round(sy1)], 'face_src': [fx, fy, fw, fh]}
                if not inside:
                    # An element taller than the viewport is only ever "clipped" by the viewport itself; the visitor scrolls to it.
                    tall = ci['el'][3] >= (844 if it.get('width') == 'phone' else 900) * 0.9
                    verdicts.append(('TALL-ELEMENT' if tall else ('CUT' if pos == 'centred' else 'WARN-' + pos)) + f" face@screen{face_screen} clip{ci['clip']}")
                if pos == 'centred' and fh * s2 < 24: verdicts.append(f'FACE-TOO-SMALL ({round(fh*s2)}px)')
        else:
            detail['faces'] = 'none detected'
        # letterbox: uniform columns/rows at edges of shown region
        (sx0, sy0), (sx1, sy1), _ = shown_region(it, c, info)
        img = info['img']; H, W = img.shape[:2]
        x0, y0, x1, y1 = [int(max(0, min(v, m))) for v, m in zip([sx0, sy0, sx1, sy1], [W, H, W, H])]
        if x1 - x0 > 20 and y1 - y0 > 20:
            reg = img[y0:y1, x0:x1]
            band = max(4, int(0.06 * reg.shape[1]))
            def uniform(a): return float(a.std()) < 1.5 and (float(a.mean()) < 8 or float(a.mean()) > 247)
            if uniform(reg[:, :band]) and uniform(reg[:, -band:]) and float(reg[:, band:-band].std()) > 20: verdicts.append('UNIFORM-EDGES (vertical bars or plain backdrop; informational)')
            bandh = max(4, int(0.06 * reg.shape[0]))
            if uniform(reg[:bandh, :]) and uniform(reg[-bandh:, :]) and float(reg[bandh:-bandh, :].std()) > 20: verdicts.append('UNIFORM-EDGES (horizontal bars or plain backdrop; informational)')
    rows.append({'page': it['page'], 'width': it['width'], 'slot': it.get('slot'), 'src': key, 'kind': it['kind'], 'alt': it.get('alt'), 'nat': [info['w'], info['h']] if info else nat, 'el': c and c['el'], 'clip': c and c['clip'], 'fit': it.get('fit'), 'verdicts': verdicts, 'detail': detail, 'shot': it.get('shot'), 'id': it['id']})
# duplicates
for r in rows:
    pk = (r.get('page'), r.get('width'))
    if r.get('src') and seen_per_page.get(pk, {}).get(r['src'], 0) > 1: r['verdicts'].append(f"DUPLICATE x{seen_per_page[pk][r['src']]}")
json.dump(rows, open('rows.json', 'w'), indent=1)
from collections import Counter
cnt = Counter()
for r in rows:
    for v in r['verdicts']: cnt[v.split(' ')[0]] += 1
print('rows', len(rows)); print(dict(cnt))
