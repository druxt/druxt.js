#!/bin/sh
# Container entrypoint: resolve this environment's preview origin, then hand
# the process to the Nuxt server.
set -e

sh scripts/rewrite-origin.sh

# exec, so the server is PID 1 and a redeploy's SIGTERM reaches it directly
# instead of being swallowed by this shell.
exec yarn start
