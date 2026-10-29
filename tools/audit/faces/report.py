import json, os, sys, collections, subprocess
import cv2
rows = json.load(open('rows.json'))
inv = {i['id'] + '|' + i['page'] + '|' + i['width']: i for i in json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'inventory3.json')) if 'id' in i}
def short(src): return src.split('/')[-1] if src else ''
lines = ['# djoteo.com image audit (live site), ' + subprocess.check_output(['date', '-u', '+%Y-%m-%d %H:%MZ']).decode().strip(), '',
'Method: Playwright Chromium, 1440x900 (dpr 1) and 390x844 (dpr 2, mobile emulation). Every <img> and CSS background-image rendering above 40x40 px was measured at three scroll positions (element centred in the viewport, element just entered from the bottom, element about to leave at the top). The visible clip box is the intersection of the element with every clipping ancestor. Faces: OpenCV YuNet (2023mar) on the full-resolution source; the largest face is taken as the subject. CUT = face box not fully inside the visible clip at the centred position (4 px tolerance); WARN-entered/WARN-leaving = cut at the other positions. BLURRY = rendered device pixels exceed the source width by >15%. UNIFORM-EDGES = informational only: uniform near-black/near-white columns or rows at the edges of the shown region (true letterboxing or a plain studio backdrop; the rentals product shots and the footer cut-out figure trip it legitimately). DUPLICATE = same source file more than once on the page. CAROUSEL = hero slider slides, which rotate in 3D and are judged on source framing (CUT-SOURCE = face touches the file edge). Full numbers: rows.json; raw measurements: inventory3.json; clip screenshots: clips/.', '']
cnt = collections.Counter()
for r in rows:
    for v in r['verdicts']: cnt[v.split(' ')[0]] += 1
lines += ['## Counts', '', '| verdict | rows |', '|---|---|'] + [f'| {k} | {v} |' for k, v in sorted(cnt.items())] + [f'| rows total | {len(rows)} |', '']
# problems first
prob = [r for r in rows if any(v.startswith(('CUT', 'WARN', 'BLURRY', 'BROKEN', 'FACE-TOO', 'UNREADABLE', 'PAGE-ERROR')) for v in r['verdicts'])]
lines += ['## Problems (every CUT / WARN / BLURRY / BROKEN / small face)', '']
cut_shots = []
for r in prob:
    lines.append(f"### {r['page']} · {r['width']} · slot {r.get('slot')} · {short(r.get('src'))}")
    lines.append(f"- verdicts: {' ; '.join(r['verdicts'])}")
    if r.get('el'): lines.append(f"- element on screen (centred): x={r['el'][0]} y={r['el'][1]} w={r['el'][2]} h={r['el'][3]}; visible clip box: {r.get('clip')}; object-fit/position: {r.get('fit')}; natural: {r.get('nat')}")
    d = r.get('detail') or {}
    for pos in ('centred', 'entered', 'leaving'):
        if pos in d:
            x = d[pos]; lines.append(f"- {pos}: face on screen {x['face_screen']} vs clip {x['clip']}; source region shown {x['shown_src']} (file px); face in file {x['face_src']}")
    # crop recommendation
    if 'centred' in d and r.get('nat'):
        W, H = r['nat']; fx, fy, fw, fh = d['centred']['face_src']
        bands = [d[p]['shown_src'] for p in ('centred', 'entered', 'leaving') if p in d]
        y0 = max(b[1] for b in bands); y1 = min(b[3] for b in bands); x0 = max(b[0] for b in bands); x1 = min(b[2] for b in bands)
        el = r['el']; aspect = el[2] / el[3]
        # the img fills the element: the crop must have the element's aspect; pick a crop height so the face sits inside the always-visible band with headroom
        band_h = max(1, y1 - y0)
        # face should occupy at most ~35% of the always-visible band height, with 0.6 face-height of headroom
        crop_h = min(H, max(int((fh * 1.6) / max(0.35 * (band_h / (bands[0][3] - bands[0][1])), 0.2)), int(fh * 3)))
        crop_w = int(crop_h * aspect)
        if crop_w > W: crop_w = W; crop_h = int(W / aspect)
        cx = fx + fw / 2; cy = fy + fh / 2
        # place the face centre at the vertical centre of the always-visible band within the crop
        band_frac = ((y0 + y1) / 2 - bands[0][1]) / max(1, (bands[0][3] - bands[0][1]))
        top = int(cy - band_frac * crop_h); left = int(cx - crop_w / 2)
        top = max(0, min(top, H - crop_h)); left = max(0, min(left, W - crop_w))
        lines.append(f"- recommendation: re-cut the file to aspect {aspect:.2f} (element {el[2]}x{el[3]}): crop {crop_w}x{crop_h} at (x={left}, y={top}) of the {W}x{H} source, which puts the face centre at {band_frac:.0%} of the crop height, inside the band that stays visible at all three scroll positions (file rows {y0}-{y1} today). If the source has no room above the head, choose a frame where the head sits lower.")
    if r.get('shot') and any(v.startswith('CUT') for v in r['verdicts']): cut_shots.append((r['shot'], f"{r['width']} {r['page']} {short(r['src'])}"))
    lines.append('')
# full table
lines += ['## Every image, every width', '', '| page | width | slot | source | natural | element (centred) | clip box | verdicts |', '|---|---|---|---|---|---|---|---|']
for r in rows:
    lines.append(f"| {r['page']} | {r['width']} | {r.get('slot')} | {short(r.get('src'))} | {r.get('nat')} | {r.get('el')} | {r.get('clip')} | {'; '.join(v.split(' face')[0] for v in r['verdicts']) or 'ok'} |")
open('REPORT.md', 'w').write('\n'.join(lines))
# contact sheet of CUT cases
if cut_shots:
    args = ['magick', 'montage', '-font', 'Helvetica', '-pointsize', '14', '-tile', '4x', '-geometry', '360x300+8+8', '-background', '#222', '-fill', 'white']
    for s, label in cut_shots:
        if os.path.exists(s): args += ['-label', label.replace('%', '%%'), s]
    args.append('CUT_sheet.jpg')
    try: subprocess.run(args, check=True, capture_output=True)
    except Exception as e:
        args = [a for a in args if a not in ('-font', 'Helvetica')]; subprocess.run(args, check=False, capture_output=True)
print('report rows', len(rows), 'problems', len(prob), 'cut shots', len(cut_shots))
