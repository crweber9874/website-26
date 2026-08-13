#!/usr/bin/env bash
# Sync the rendered course readers from the methodology_ground_up repo into
# public/teaching/, which is what this site deploys.
#
#   POL 682  readers/weber/linear-regression    -> public/teaching/pol682/
#   POL 683  readers/weber/advanced-regression  -> public/teaching/pol683/
#
# The books are authored and rendered in methodology_ground_up; this repo only
# publishes the output. Do not edit anything under public/teaching/ by hand.
#
#   scripts/sync-readers.sh              # copy the readers already rendered there
#   scripts/sync-readers.sh --render     # render them first (needs quarto + R/renv)
#   HUB=/path/to/methodology_ground_up scripts/sync-readers.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HUB="${HUB:-$(cd "$ROOT/.." && pwd)/methodology_ground_up}"
RENDER=0
[[ "${1:-}" == "--render" ]] && RENDER=1

if [[ ! -d "$HUB" ]]; then
  echo "error: methodology_ground_up not found at $HUB" >&2
  echo "       clone it beside this repo, or set HUB=/path/to/methodology_ground_up" >&2
  exit 1
fi

# slug in the hub -> directory served by this site
READERS=(
  "weber/linear-regression:pol682"
  "weber/advanced-regression:pol683"
)

if [[ $RENDER -eq 1 ]]; then
  if [[ ! -x "$HUB/scripts/render-readers.sh" ]]; then
    echo "error: $HUB/scripts/render-readers.sh not found or not executable" >&2
    exit 1
  fi
  for entry in "${READERS[@]}"; do
    slug="${entry%%:*}"
    echo "==> rendering $slug in the hub"
    (cd "$HUB" && scripts/render-readers.sh "$slug")
  done
fi

for entry in "${READERS[@]}"; do
  slug="${entry%%:*}"
  dest_name="${entry##*:}"
  src="$HUB/site/public/readers/$slug"
  dest="$ROOT/public/teaching/$dest_name"

  if [[ ! -f "$src/index.html" ]]; then
    echo "error: no rendered reader at $src" >&2
    echo "       run: scripts/sync-readers.sh --render" >&2
    exit 1
  fi

  echo "==> $slug -> public/teaching/$dest_name"
  mkdir -p "$dest"
  rsync -a --delete --exclude '.DS_Store' "$src/" "$dest/"
done

# The sync overwrites the rendered HTML, so the back-to-site bar goes on last.
bash "$ROOT/scripts/inject-book-chrome.sh"

echo "done. commit public/teaching/** to publish."
