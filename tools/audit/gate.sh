#!/bin/zsh
# Pre-push gate for djoteo.com. Run against the local build (default) or the live site (BASE=https://djoteo.com).
# Every check must end with its "clean" line. Nothing is pushed while any check fails.
set -u
cd "$(dirname "$0")"
export BASE="${BASE:-http://127.0.0.1:8765}"
export FACES_PY="${FACES_PY:-$HOME/code/djoteo-audit-venv/bin/python3}"
if [[ "$BASE" == http://127.0.0.1:* ]] && ! curl -s -o /dev/null "$BASE/"; then (python3 serve.py 8765 >/tmp/djoteo-serve.log 2>&1 &); sleep 1; fi
fail=0
run(){ echo "▶ $1"; local out; out=$(node "$2" "${@:3}" 2>&1); echo "$out" | tail -n "${LINES_TAIL:-6}"; echo "$out" | grep -qE "$3_OK_PATTERN" 2>/dev/null; }
echo "=== djoteo gate on $BASE  $(date -u +%Y-%m-%dT%H:%MZ)"
H=$(node hydration.mjs 2>&1); echo "$H" | tail -4; echo "$H" | grep -q "HYDRATION: all clean" || fail=1
L=$(node links.mjs 2>&1); echo "$L" | tail -3; echo "$L" | grep -q "LINKS: broken=0 undecodable-images=0 duplicate-ids=0 console-errors=0" || fail=1
T=$(node tpl-leftovers.mjs 2>&1); echo "$T" | grep -c "visible=[1-9]" | xargs -I{} echo "template-leftovers visible on {} page/width combos"; echo "$T" | grep -q "visible=[1-9]" && fail=1
I=$(node idleflick.mjs 2>&1); echo "$I" | grep -E "^BAD|IDLE"; echo "$I" | grep -q "IDLE: all still" || fail=1
G=$(node gpuflick.mjs "/,/works/,/works/casa-mezcal/,/blog/,/residencies" 2>&1); echo "$G" | grep -E "###|late=" | tail -15; echo "$G" | grep -q "SITE-FLICKER" && { echo "GPU: site-caused change after settling"; fail=1; }
F=$(cd faces && PAGES="/,/works/,/works/debonair-supper-club/,/works/casa-mezcal/,/works/the-h-orlando/,/works/helena-modern-riviera/,/works/ava-mediterraegean/,/blog/" node collect.mjs >/dev/null 2>&1 && "$FACES_PY" analyze.py inventory.json >/dev/null 2>&1 && "$FACES_PY" -c "import json;r=json.load(open(\"rows.json\"));c=[x for x in r if any(v.startswith(\"CUT\") for v in x[\"verdicts\"])];print(\"FACES:\",len(c),\"cut\");[print(\"  \",x.get(\"page\"),x.get(\"width\"),(x.get(\"src\") or \"\").split(\"/\")[-1]) for x in c]"); echo "$F" | tail -6; echo "$F" | grep -q "FACES: 0 cut" || fail=1
echo "=== GATE $([ $fail = 0 ] && echo PASS || echo FAIL)"; exit $fail
