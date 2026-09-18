#!/usr/bin/env bash
# Builds and serves the audited examples in production mode under the repo's
# Node 16. Usage: serve-examples.sh start|stop [example ...]
set -euo pipefail

cd "$(dirname "$0")/../.."
root="$(pwd)"
cmd="${1:-start}"; shift || true

# `stop` only signals recorded process groups, so it must work under any Node, or none.
if [ "$cmd" != "stop" ]; then
  node_major="$(node -v | sed -E 's/^v([0-9]+)\..*/\1/')"
  if [ "$node_major" != "16" ]; then
    echo "serve-examples.sh needs Node 16 on PATH, found $(node -v)." >&2
    exit 2
  fi
fi

examples=("$@"); [ ${#examples[@]} -gt 0 ] || examples=(druxt-site druxt-daisyui druxt-bootstrapvue)
declare -A ports=([druxt-site]=3200 [druxt-daisyui]=3201 [druxt-bootstrapvue]=3204)
mkdir -p "$root/.perf"

proxy_port="${PERF_AUDIT_PROXY_PORT:-8890}"
proxy_pidfile="$root/.perf/proxy.pid"
proxy_log="$root/.perf/backend-requests.log"

# setsid below makes the recorded pid its own process group leader; both npx
# and the audit's proxy can end up with a live child that outlives the pid we
# captured, so a plain `kill` on that pid can miss it. Signal the whole group.
stop_group() {
  kill -TERM "-$1" 2>/dev/null || kill -TERM "$1" 2>/dev/null || true
}

wait_for_port() {
  for _ in $(seq 1 "$2"); do
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3<&- 3>&- && return 0
    sleep 1
  done
  return 1
}

proxy_running() {
  [ -f "$proxy_pidfile" ] && kill -0 "$(cat "$proxy_pidfile")" 2>/dev/null
}

if [ "$cmd" = "stop" ]; then
  for example in "${examples[@]}"; do
    pidfile="$root/.perf/${example}.pid"
    if [ -f "$pidfile" ]; then
      stop_group "$(cat "$pidfile")"
      rm -f "$pidfile"
      echo "stopped $example"
    fi
  done
  if [ -f "$proxy_pidfile" ]; then
    stop_group "$(cat "$proxy_pidfile")"
    rm -f "$proxy_pidfile"
    echo "stopped proxy"
  fi
  exit 0
fi

# The audit brings its own request log: some backends never write a
# per-request completion line to their own log, so counting backend requests
# through the provisioned backend is unreliable. This proxy sits between the
# examples and the real backend and logs every forwarded request itself. One
# proxy is shared across every example, so a second `start` (e.g. one example
# at a time) must not restart it underneath the examples already using it.
if proxy_running; then
  echo "proxy already running on ${proxy_port}"
else
  : >"$proxy_log"
  (
    cd "$root"
    exec setsid node scripts/perf-audit/backend-proxy.mjs --port "$proxy_port" --target "${BASE_URL:-http://127.0.0.1:8888}" --log "$proxy_log"
  ) >"$root/.perf/proxy.log" 2>&1 &
  echo $! >"$proxy_pidfile"
  wait_for_port "$proxy_port" 30 || { echo "proxy did not start; see $root/.perf/proxy.log" >&2; exit 1; }
fi

for example in "${examples[@]}"; do
  pidfile="$root/.perf/${example}.pid"
  # The examples set target: 'static' for `nuxt generate`/export; the audit
  # needs a live per-request SSR server instead, so force --target server.
  (
    cd "$root/examples/$example"
    corepack yarn install --silent
    BASE_URL="http://127.0.0.1:${proxy_port}" npx nuxt build --target server
  ) >"$root/.perf/${example}.build.log" 2>&1
  (
    cd "$root/examples/$example"
    exec setsid env BASE_URL="http://127.0.0.1:${proxy_port}" npx nuxt start --target server --port "${ports[$example]}" --hostname 127.0.0.1
  ) >"$root/.perf/${example}.start.log" 2>&1 &
  echo $! >"$pidfile"
  for _ in $(seq 1 60); do curl -fsS -o /dev/null "http://127.0.0.1:${ports[$example]}/" && break; sleep 2; done
  curl -fsS -o /dev/null "http://127.0.0.1:${ports[$example]}/" || { echo "$example did not start; see $root/.perf/${example}.start.log" >&2; exit 1; }
  echo "$example on ${ports[$example]}"
done
