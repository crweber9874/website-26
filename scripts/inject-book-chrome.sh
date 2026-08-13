#!/usr/bin/env bash
# Inject a sticky "back to site" bar into rendered book HTML under public/teaching.
# Re-run after scripts/sync-readers.sh — a sync overwrites the rendered HTML.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

python3 - "$ROOT" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
marker = 'id="cw-site-bar"'

# course directory -> what the bar says you are reading
BOOKS = {
    "pol682": "POL 682 · Linear Regression Analysis",
    "pol683": "POL 683 · Advanced Regression & Causal Inference",
}


def make_bar(label: str) -> str:
    return (
        '<div id="cw-site-bar" style="position:sticky;top:0;z-index:99999;display:flex;'
        "gap:16px;align-items:center;justify-content:space-between;padding:8px 16px;"
        "background:#0C234B;color:#fff;font:600 13px/1.3 system-ui,sans-serif;"
        'border-bottom:3px solid #AB0520">'
        '<a href="/teaching" style="color:#fff;text-decoration:none">&larr; Teaching</a>'
        f'<span style="color:rgba(255,255,255,.75);font-weight:500">{label}</span>'
        '<a href="/" style="color:rgba(255,255,255,.75);text-decoration:none">christopher-weber.com</a>'
        "</div>"
    )


body = re.compile(r"(<body\b[^>]*>)", re.I)
n = 0
for slug, label in BOOKS.items():
    d = root / "public/teaching" / slug
    if not d.exists():
        continue
    bar = make_bar(label)
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
