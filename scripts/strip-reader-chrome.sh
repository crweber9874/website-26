#!/usr/bin/env bash
# Remove GitHub / download / edit chrome from rendered course readers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

python3 - "$ROOT" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
dirs = [root / "public/pedagogy/pol682", root / "public/pedagogy/pol683"]

gh = re.compile(
    r'\s*<a href="https://github\.com/[^"]*" title="Source Code"[^>]*>.*?</a>\s*',
    re.I | re.S,
)
dl = re.compile(
    r'\s*<div class="[^"]*dropdown[^"]*"[^>]*>\s*<a[^>]*title="Download"[^>]*>.*?</div>\s*',
    re.I | re.S,
)
pdf = re.compile(
    r'\s*<a[^>]*href="\./Linear-Regression-Analysis\.(pdf|epub)"[^>]*>.*?</a>\s*',
    re.I | re.S,
)
edit_cfg = re.compile(
    r'"edit"\s*:\s*\{\s*"link"\s*:\s*"[^"]*"\s*,\s*"text"\s*:\s*"[^"]*"\s*\}',
    re.S,
)
dl_cfg = re.compile(r'"download"\s*:\s*\[[^\]]*\]')
meta = re.compile(r'\s*<meta name="github-repo"[^>]*>\s*', re.I)
edit_a = re.compile(
    r'<a[^>]*href="https://github\.com/[^"]+/edit/[^"]*"[^>]*>[\s\S]*?</a>',
    re.I,
)

n = 0
for d in dirs:
    if not d.exists():
        continue
    for f in d.rglob("*.html"):
        t = f.read_text(encoding="utf-8", errors="ignore")
        o = t
        t = gh.sub("\n", t)
        t = dl.sub("\n", t)
        t = pdf.sub("\n", t)
        t = edit_a.sub("", t)
        t = edit_cfg.sub('"edit": {"link": null, "text": null}', t)
        t = dl_cfg.sub('"download": null', t)
        t = meta.sub("\n", t)
        if t != o:
            f.write_text(t, encoding="utf-8")
            n += 1
print(f"stripped github/download chrome from {n} files")
PY
