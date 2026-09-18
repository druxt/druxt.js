#!/usr/bin/env bash
# Builds and serves the audited examples in production mode under the repo's
# Node 16. Usage: serve-examples.sh start|stop [example ...]
set -euo pipefail

node_major="$(node -v | sed -E 's/^v([0-9]+)\..*/\1/')"
if [ "$node_major" != "16" ]; then
  echo "serve-examples.sh needs Node 16 on PATH, found $(node -v)." >&2
  exit 2
fi

cd "$(dirname "$0")/../.."
root="$(pwd)"
cmd="${1:-start}"; shift || true
examples=("$@"); [ ${#examples[@]} -gt 0 ] || examples=(druxt-site druxt-daisyui druxt-bootstrapvue)
declare -A ports=([druxt-site]=3200 [druxt-daisyui]=3201 [druxt-bootstrapvue]=3204)
mkdir -p "$root/.perf"
for example in "${examples[@]}"; do
  pidfile="$root/.perf/${example}.pid"
  if [ "$cmd" = "stop" ]; then
    if [ -f "$pidfile" ]; then
      # setsid below makes this pid its own process group leader; npx forks
      # nuxt's real server as a child that outlives npx, so a plain `kill`
      # on the recorded pid missed it. Signal the whole group instead.
      pid="$(cat "$pidfile")"
      kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      rm -f "$pidfile"
      echo "stopped $example"
    fi
    continue
  fi
  # The examples set target: 'static' for `nuxt generate`/export; the audit
  # needs a live per-request SSR server instead, so force --target server.
  (
    cd "$root/examples/$example"
    corepack yarn install --silent
    BASE_URL="${BASE_URL:-http://127.0.0.1:8888}" npx nuxt build --target server
  ) >"$root/.perf/${example}.build.log" 2>&1
  (
    cd "$root/examples/$example"
    exec setsid env BASE_URL="${BASE_URL:-http://127.0.0.1:8888}" npx nuxt start --target server --port "${ports[$example]}" --hostname 127.0.0.1
  ) >"$root/.perf/${example}.start.log" 2>&1 &
  echo $! >"$pidfile"
  for _ in $(seq 1 60); do curl -fsS -o /dev/null "http://127.0.0.1:${ports[$example]}/" && break; sleep 2; done
  curl -fsS -o /dev/null "http://127.0.0.1:${ports[$example]}/" || { echo "$example did not start; see $root/.perf/${example}.start.log" >&2; exit 1; }
  echo "$example on ${ports[$example]}"
done
