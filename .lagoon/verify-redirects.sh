#!/usr/bin/env bash
# Verify the redirects-map covers every legacy guide/guides URL and that every
# redirect target exists as a generated page under docs/nuxt/dist.
#
# Usage: .lagoon/verify-redirects.sh [path-to-docs-nuxt-dist]   (default: docs/nuxt/dist)
set -euo pipefail

MAP="$(cd "$(dirname "$0")" && pwd)/redirects-map.conf"
DIST="${1:-$(cd "$(dirname "$0")/.." && pwd)/docs/nuxt/dist}"

[ -d "$DIST" ] || { echo "FAIL: dist directory not found: $DIST (run 'yarn generate' first)"; exit 1; }

fails=0
total=0

while IFS=' ;' read -r src target; do
  [ -n "$src" ] || continue
  total=$((total + 1))
  path="${target#https://druxtjs.org}"
  if [ ! -f "$DIST$path/index.html" ] && [ ! -f "$DIST$path.html" ]; then
    echo "FAIL: $src -> $target (no generated page at $path)"
    fails=$((fails + 1))
  fi
done < <(grep -E '^/(guide|guides)|^/api/components' "$MAP" || true)

if [ "$fails" -gt 0 ]; then
  echo "FAIL: $fails of $total legacy redirects have no generated target page"
  exit 1
fi

echo "OK: $total legacy redirects verified against generated pages"
