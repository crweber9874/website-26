#!/usr/bin/env bash
# Inject a sticky "back to site" bar into rendered book HTML under public/pedagogy.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

python3 - "$ROOT" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
marker = 'id="cw-site-bar"'
bar = (
    '<div id="cw-site-bar" style="position:sticky;top:0;z-index:99999;display:flex;'
    'gap:16px;align-items:center;justify-content:space-between;padding:8px 16px;'
    'background:#0a0a0a;color:#f5f5f4;font:600 13px/1.3 system-ui,sans-serif;'
    'border-bottom:1px solid rgba(255,255,255,.12)">'
    '<a href="/pedagogy/" style="color:#f5f5f4;text-decoration:none">← Teaching resources</a>'
    '<a href="/" style="color:rgba(245,245,244,.7);text-decoration:none">christopher-weber.com</a>'
    "</div>"
)
body = re.compile(r"(<body\b[^>]*>)", re.I)
n = 0
for d in (root / "public/pedagogy/pol682", root / "public/pedagogy/pol683"):
    if not d.exists():
        continue
    for f in d.rglob("*.html"):
        t = f.read_text(encoding="utf-8", errors="ignore")
        if marker in t:
            continue
        newt, count = body.subn(r"\1\n" + bar + "\n", t, count=1)
        if count:
            f.write_text(newt, encoding="utf-8")
            n += 1
print(f"Injected site bar into {n} HTML files.")
PY
