#!/usr/bin/env bash
# Verify the redirects-map: every key must be host-prefixed (the map is keyed
# on $host$uri, so a key starting with / can never match, a class of
# breakage that shipped silently in 2021),
# druxtjs.org path keys must cover both slash forms, and every redirect
# target must exist as a generated page under docs/nuxt/dist.
#
# Usage: .lagoon/verify-redirects.sh [path-to-docs-nuxt-dist]   (default: docs/nuxt/dist)
set -euo pipefail

MAP="$(cd "$(dirname "$0")" && pwd)/redirects-map.conf"
DIST="${1:-$(cd "$(dirname "$0")/.." && pwd)/docs/nuxt/dist}"

[ -d "$DIST" ] || { echo "FAIL: dist directory not found: $DIST (run 'yarn generate' first)"; exit 1; }

fails=0
total=0

while IFS=' ' read -r src target; do
  [ -n "$src" ] || continue
  total=$((total + 1))

  case "$src" in
    /*)
      echo "FAIL: $src is a bare path key: the map is keyed on \$host\$uri, so it can never match"
      fails=$((fails + 1))
      continue
      ;;
    '~^(www\.)?druxtjs\.org'*)
      case "$src" in
        *'/?$')
          ;;
        *)
          echo "FAIL: $src does not end with '/?\$': it must cover both slash forms, anchored"
          fails=$((fails + 1))
          continue
          ;;
      esac
      ;;
    '~^'*.druxtjs.org*)
      # Legacy subdomain entries: no form requirement, but their targets
      # are still checked below.
      ;;
    *)
      echo "FAIL: $src is not host-prefixed"
      fails=$((fails + 1))
      continue
      ;;
  esac

  # Targets with runtime variables cannot be checked against dist.
  case "$target" in *'$'*) continue ;; esac

  path="${target#https://druxtjs.org}"
  path="${path%;}"
  path="${path%/}"
  if [ ! -f "$DIST$path/index.html" ] && [ ! -f "$DIST$path.html" ]; then
    echo "FAIL: $src -> $target (no generated page at $path)"
    fails=$((fails + 1))
  fi
done < <(grep -vE '^[[:space:]]*(#|$)' "$MAP")

if [ "$fails" -gt 0 ]; then
  echo "FAIL: $fails of $total redirect entries failed verification"
  exit 1
fi

echo "OK: $total redirect entries verified (host-prefixed, both URL forms, targets generated)"
