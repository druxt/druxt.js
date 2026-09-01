#!/bin/sh
# On non-production Lagoon, point the baked absolute URLs (og:url, og:image,
# canonical, sitemap.xml, llms.txt and the client payloads) at this
# environment's own route. Routes exist only at runtime in Lagoon - they are
# never passed as build args - so this cannot happen at generate time.
# Production skips it and keeps the canonical domain.
if [ "$LAGOON_ENVIRONMENT_TYPE" != "production" ] && [ -n "$LAGOON_ROUTE" ]; then
  route="${LAGOON_ROUTE%/}"
  find dist -type f \
    \( -name '*.html' -o -name '*.js' -o -name '*.json' -o -name '*.xml' \
    -o -name '*.txt' -o -name '*.css' -o -name '*.webmanifest' \) \
    -exec sed -i "s|https://druxtjs.org|${route}|g" {} +
  echo "start: rewrote baked origin to ${route}"
fi
exec yarn start
