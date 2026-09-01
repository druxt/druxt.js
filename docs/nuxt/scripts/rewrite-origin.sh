#!/bin/sh
# Point the baked absolute URLs (og:url, og:image, canonical, sitemap.xml,
# llms.txt and the hydration payloads) at this environment's own route.
#
# Lagoon routes exist only at runtime, never as build args, so the origin
# cannot be resolved at generate time. Production keeps the canonical domain.
#
# Matched by content rather than by extension: `nuxt generate` decides what it
# emits, and an extension list silently misses anything new (a source map, an
# extensionless file), which would regress previews to production URLs with
# nothing to notice it. `grep -I` skips binaries, so images stay untouched.
set -e

ORIGIN='https://druxtjs.org'

[ "$LAGOON_ENVIRONMENT_TYPE" = 'production' ] && exit 0
[ -n "$LAGOON_ROUTE" ] || exit 0

route="${LAGOON_ROUTE%/}"
matches=$(grep -rIl "$ORIGIN" dist 2>/dev/null || true)

[ -n "$matches" ] || exit 0

printf '%s\n' "$matches" | xargs sed -i "s|$ORIGIN|$route|g"
echo "start: rewrote baked origin to $route"
