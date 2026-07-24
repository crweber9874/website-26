#!/usr/bin/env bash
# Render POL 682 (Quarto) and POL 683 (bookdown) into public/pedagogy/.
# Requires: quarto CLI, R with bookdown installed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUB682="$ROOT/public/pedagogy/pol682"
PUB683="$ROOT/public/pedagogy/pol683"

echo "==> POL 682 · Quarto book"
if ! command -v quarto >/dev/null 2>&1; then
  echo "error: quarto not found on PATH" >&2
  exit 1
fi
(
  cd "$ROOT/teaching/pol682"
  # HTML only for the public site (PDF/EPUB optional locally)
  quarto render --to html
)
mkdir -p "$PUB682"
rsync -a --delete \
  --exclude '.DS_Store' \
  "$ROOT/teaching/pol682/_site/" \
  "$PUB682/"
echo "    → $PUB682"

echo "==> POL 683 · bookdown gitbook"
if ! command -v Rscript >/dev/null 2>&1; then
  echo "error: Rscript not found on PATH" >&2
  exit 1
fi
(
  cd "$ROOT/teaching/pol683"
  Rscript -e 'if (!requireNamespace("bookdown", quietly = TRUE)) stop("Install bookdown: install.packages(\"bookdown\")"); bookdown::render_book("index.Rmd", "bookdown::gitbook", output_dir = "_book")'
)
mkdir -p "$PUB683"
rsync -a --delete \
  --exclude '.DS_Store' \
  "$ROOT/teaching/pol683/_book/" \
  "$PUB683/"
echo "    → $PUB683"

echo "==> Inject site chrome into book HTML"
bash "$ROOT/scripts/inject-book-chrome.sh"

echo "==> Strip GitHub / download links from readers"
bash "$ROOT/scripts/strip-reader-chrome.sh"

echo "==> Done. Commit teaching/ + public/pedagogy/ after reviewing the build."
