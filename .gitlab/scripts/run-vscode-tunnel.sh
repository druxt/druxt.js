#!/usr/bin/env bash
# Open a VS Code server on the job's checkout through a Cloudflare tunnel.
#
# Usage: run-vscode-tunnel.sh          (run as a manual job's script)
#
# Manual, always. This is an interactive shell on the runner, holding the
# checkout and whatever the job's variables grant, so it exists only when a
# person asked for it and it dies with the job that opened it.
#
# Two tunnel modes, chosen by whether a token is present:
#
#   named  CLOUDFLARE_TUNNEL_TOKEN set. Runs a pre-created tunnel, so the
#          hostname is stable and a Cloudflare Access policy can sit in front
#          of it. Supply VSCODE_TUNNEL_HOSTNAME for the note: the hostname
#          is set on the Cloudflare side of the tunnel's config, so nothing
#          here can discover it.
#   quick  No token. A Quick Tunnel on trycloudflare.com, no account needed,
#          URL discovered from the log. Always password-protected: see below.
#
# Environment:
#   CLOUDFLARE_TUNNEL_TOKEN      optional. Selects the named mode.
#   VSCODE_TUNNEL_HOSTNAME       required in named mode, for the posted note.
#   VSCODE_TUNNEL_PASSWORD       optional. Used as-is and never printed.
#                                Set it as a masked CI variable on any project
#                                whose job logs are readable by people who
#                                should not get a shell.
#   VSCODE_TUNNEL_AUTH           optional. `none` asks for no password. It is
#                                refused in quick mode, and in named mode it is
#                                honoured ONLY with the variable below too.
#   VSCODE_TUNNEL_ACCESS_POLICY  optional. `confirmed` says a Cloudflare Access
#                                policy covers VSCODE_TUNNEL_HOSTNAME. Nothing
#                                here can check that, so a named tunnel alone
#                                is not taken as proof: without this the
#                                script warns and keeps the password.
#   VSCODE_TUNNEL_DIR            directory to open. Default: the checkout.
#   VSCODE_TUNNEL_PORT           local port. Default: 8443
#   VSCODE_TUNNEL_KEEP_ALIVE_MINUTES  how long to hold it. Default: 55
#                                Keep it under the job timeout.
#   CODE_SERVER_VERSION          pinned release. Default below.
#   CLOUDFLARED_VERSION          pinned release. Default below.
#   GITLAB_API_TOKEN et al       as required by post-vscode-tunnel-comment.sh.
#                                Absent, the URL is printed and not posted, so
#                                this works outside a merge-request pipeline.
#
# code-server binds to 127.0.0.1, never 0.0.0.0: the tunnel is the only route
# in. The password is written to a config file read only by its owner, not
# passed in the environment where any child process can read it back.
#
# The download is about 220MB and is not cached: a cache entry that large
# costs more to move than the download, and a poisoned one would be a binary
# nobody checksums again.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

tunnel_dir="${VSCODE_TUNNEL_DIR:-${CI_PROJECT_DIR:-$PWD}}"
tunnel_port="${VSCODE_TUNNEL_PORT:-8443}"
keep_alive_minutes="${VSCODE_TUNNEL_KEEP_ALIVE_MINUTES:-55}"
code_server_version="${CODE_SERVER_VERSION:-4.140.0}"
cloudflared_version="${CLOUDFLARED_VERSION:-2026.7.3}"

marker="<!-- vscode-tunnel -->"
server_pid=""
tunnel_pid=""
work_dir=""

cleanup() {
  [ -n "$server_pid" ] && kill "$server_pid" 2>/dev/null || true
  [ -n "$tunnel_pid" ] && kill "$tunnel_pid" 2>/dev/null || true
  # The URL stops resolving the moment this job ends, so the note goes with it.
  if [ -n "${GITLAB_API_TOKEN:-}" ]; then
    bash "$script_dir/delete-mr-note.sh" "$marker" 2>/dev/null || true
  fi
  [ -n "$work_dir" ] && rm -rf "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT
# A cancelled job exits non-zero, not with cleanup's status.
trap 'cleanup; exit 143' INT TERM

if [ ! -d "$tunnel_dir" ]; then
  echo "Nothing to open: ${tunnel_dir} does not exist." >&2
  exit 1
fi

mode="quick"
[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ] && mode="named"

if [ "$mode" = "named" ] && [ -z "${VSCODE_TUNNEL_HOSTNAME:-}" ]; then
  echo "CLOUDFLARE_TUNNEL_TOKEN is set but VSCODE_TUNNEL_HOSTNAME is not." >&2
  echo "The hostname is set in the tunnel's Cloudflare config; name it here." >&2
  exit 1
fi

# Resolve the password before anything is downloaded or started, so a project
# that cannot be protected fails immediately rather than after a 220MB fetch.
password=""
auth="password"
if [ -z "${VSCODE_TUNNEL_PASSWORD:-}" ] && [ "${VSCODE_TUNNEL_AUTH:-}" = "none" ]; then
  # Only ever reachable behind Access. A Quick Tunnel URL is public internet,
  # and an unauthenticated editor on one is a shell for whoever finds it.
  if [ "$mode" != "named" ]; then
    echo "VSCODE_TUNNEL_AUTH=none needs a named tunnel with Access in front." >&2
    echo "Set CLOUDFLARE_TUNNEL_TOKEN, or set VSCODE_TUNNEL_PASSWORD." >&2
    exit 1
  fi
  # A named tunnel routes the hostname whether or not a policy covers it, so
  # the password goes only when the operator says one does. Fail closed.
  if [ "${VSCODE_TUNNEL_ACCESS_POLICY:-}" = "confirmed" ]; then
    auth="none"
    echo "Password disabled: VSCODE_TUNNEL_ACCESS_POLICY says Cloudflare Access is in front."
  else
    echo "WARNING: VSCODE_TUNNEL_AUTH=none is ignored, and the password stays." >&2
    echo "Set VSCODE_TUNNEL_ACCESS_POLICY=confirmed once a Cloudflare Access" >&2
    echo "policy covers ${VSCODE_TUNNEL_HOSTNAME}." >&2
  fi
fi
if [ "$auth" = "password" ]; then
  if [ -n "${VSCODE_TUNNEL_PASSWORD:-}" ]; then
    password="$VSCODE_TUNNEL_PASSWORD"
    echo "Using the supplied VSCODE_TUNNEL_PASSWORD."
  elif [ "${CI_PROJECT_VISIBILITY:-}" = "public" ]; then
    # A generated password is only ever shown in the job log, and on a public
    # project that log is public, which would publish the way in.
    echo "This project is public, so a generated password would be printed" >&2
    echo "into a world-readable job log. Set VSCODE_TUNNEL_PASSWORD as a" >&2
    echo "masked CI variable instead." >&2
    exit 1
  else
    password="$(head -c 18 /dev/urandom | base64 | tr -d '/+=' | head -c 24)"
    echo "Generated a one-off password; it is printed below and nowhere else."
  fi
fi

# Checksums are per architecture and pinned. An unverified binary that opens a
# public tunnel to a shell is not something to fetch on trust.
case "$(uname -m)" in
  aarch64|arm64)
    arch="arm64"
    cf_sha256="65259e652a7bea08bf5df603233ab22b8bf3116af8df9f9206209af6a1b955c0"
    cs_sha256="ae4b07153f2037b06d24749bc8004221fcbf3ffe317038401be0452f541bf200"
    ;;
  x86_64)
    arch="amd64"
    cf_sha256="9d71c677db00134c1bd4144b7783486b654ad281b1ea62b4972098d19f770f17"
    cs_sha256="864c5d01c808ade57e4d12c708717be7a187219fded60428f263b9e2da9f6b48"
    ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

work_dir="$(mktemp -d)"

echo "Fetching cloudflared ${cloudflared_version} (${arch})"
curl -sL --retry 3 \
  "https://github.com/cloudflare/cloudflared/releases/download/${cloudflared_version}/cloudflared-linux-${arch}" \
  -o "${work_dir}/cloudflared"
echo "${cf_sha256}  ${work_dir}/cloudflared" | sha256sum -c - || {
  echo "cloudflared checksum mismatch; refusing to run it." >&2
  exit 1
}
chmod +x "${work_dir}/cloudflared"

echo "Fetching code-server ${code_server_version} (${arch})"
curl -sL --retry 3 \
  "https://github.com/coder/code-server/releases/download/v${code_server_version}/code-server-${code_server_version}-linux-${arch}.tar.gz" \
  -o "${work_dir}/code-server.tar.gz"
echo "${cs_sha256}  ${work_dir}/code-server.tar.gz" | sha256sum -c - || {
  echo "code-server checksum mismatch; refusing to run it." >&2
  exit 1
}
tar -xzf "${work_dir}/code-server.tar.gz" -C "$work_dir"
code_server_bin="${work_dir}/code-server-${code_server_version}-linux-${arch}/bin/code-server"

# The password goes in a file the owner alone can read, rather than in the
# environment, where it shows up in any child's /proc entry.
config_file="${work_dir}/config.yaml"
umask 077
{
  echo "bind-addr: 127.0.0.1:${tunnel_port}"
  echo "auth: ${auth}"
  if [ "$auth" = "password" ]; then
    # A single-quoted YAML scalar, with any quote in a supplied password
    # doubled, so `: `, ` #` or a leading `*` cannot change what is read.
    q="'"
    echo "password: '${password//$q/$q$q}'"
  fi
  echo "cert: false"
} > "$config_file"

echo "Opening ${tunnel_dir} on 127.0.0.1:${tunnel_port}"
"$code_server_bin" --config "$config_file" \
  --user-data-dir "${work_dir}/user-data" \
  --extensions-dir "${work_dir}/extensions" \
  --disable-telemetry --disable-update-check \
  "$tunnel_dir" > "${work_dir}/code-server.log" 2>&1 &
server_pid=$!

for _ in $(seq 1 30); do
  curl -sf -o /dev/null "http://127.0.0.1:${tunnel_port}/healthz" && break
  kill -0 "$server_pid" 2>/dev/null || {
    echo "code-server exited before it was ready." >&2
    cat "${work_dir}/code-server.log" >&2
    exit 1
  }
  sleep 2
done
# A wait loop that times out still falls through, so assert once more and
# fail rather than post a note and hold the runner against a dead editor.
curl -sf -o /dev/null "http://127.0.0.1:${tunnel_port}/healthz" || {
  echo "code-server never became ready; its log follows." >&2
  tail -n 50 "${work_dir}/code-server.log" >&2
  exit 1
}

# cloudflared self-updates and restarts by default, which kills the tunnel
# whose URL was already posted and quietly opens a new one somewhere else.
export NO_AUTOUPDATE=true
tunnel_log="${work_dir}/tunnel.log"

if [ "$mode" = "named" ]; then
  "${work_dir}/cloudflared" tunnel --no-autoupdate run \
    --token "$CLOUDFLARE_TUNNEL_TOKEN" \
    --url "http://127.0.0.1:${tunnel_port}" > "$tunnel_log" 2>&1 &
  tunnel_pid=$!
  url="https://${VSCODE_TUNNEL_HOSTNAME}"
  # The hostname is known up front, so nothing proves the tunnel is up until
  # cloudflared registers a connection with the edge. A rejected token or an
  # unreachable edge would otherwise post a note pointing at nothing.
  connected=""
  for _ in $(seq 1 60); do
    grep -q 'Registered tunnel connection' "$tunnel_log" && { connected=1; break; }
    kill -0 "$tunnel_pid" 2>/dev/null || break
    sleep 2
  done
  if [ -z "$connected" ]; then
    echo "The tunnel did not register a connection; its log follows." >&2
    tail -n 50 "$tunnel_log" >&2
    exit 1
  fi
else
  "${work_dir}/cloudflared" tunnel --no-autoupdate \
    --url "http://127.0.0.1:${tunnel_port}" > "$tunnel_log" 2>&1 &
  tunnel_pid=$!
  url=""
  for _ in $(seq 1 60); do
    # cloudflared also logs its own API host, which is not the tunnel.
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$tunnel_log" \
      | grep -vx 'https://api\.trycloudflare\.com' | head -n1 || true)"
    [ -n "$url" ] && break
    sleep 2
  done
  if [ -z "$url" ]; then
    echo "The tunnel did not report a URL within two minutes." >&2
    cat "$tunnel_log" >&2
    exit 1
  fi
fi

# The note carries the URL. The password never leaves this log. A failed
# post must not end the session before the banner below prints the URL.
if [ -n "${GITLAB_API_TOKEN:-}" ] && [ -n "${CI_MERGE_REQUEST_IID:-}" ]; then
  bash "$script_dir/post-vscode-tunnel-comment.sh" \
    "$url" "$keep_alive_minutes" "$auth" \
    || echo "Could not post the note; the URL is below only."
else
  echo "No merge request to post to; the URL is below only."
fi

echo
echo "================ VS Code server ================"
echo "  URL:      ${url}"
if [ "$auth" = "password" ]; then
  if [ -n "${VSCODE_TUNNEL_PASSWORD:-}" ]; then
    echo "  Password: (the VSCODE_TUNNEL_PASSWORD you set)"
  else
    echo "  Password: ${password}"
  fi
else
  echo "  Password: none, Cloudflare Access is in front"
fi
echo "  Closes in ${keep_alive_minutes} minutes, or when this job is cancelled."
echo "================================================"
echo

# In the background, so a cancel runs the INT TERM trap at once: bash runs a
# trap only after the foreground command ends, and the runner may kill the
# job before a long sleep does.
sleep "$(( keep_alive_minutes * 60 ))" &
wait $!
