#!/usr/bin/env bash
# Sourced by ~/.bashrc inside the dev container. post-create.sh installs the
# line that sources it. Same shape as module-template and druxtjs.org.

# Fall back to the image's UTF-8 locale when the host forwards one this image
# has not generated: OpenSSH sends LANG and LC_* by default and every command
# would warn "setlocale: cannot change locale". Every forwarded value is
# checked, not only LANG.
available="$(locale -a 2>/dev/null)"
for forwarded in "${LANG:-}" "${LC_ALL:-}" "${LC_ADDRESS:-}" "${LC_COLLATE:-}" \
  "${LC_CTYPE:-}" "${LC_IDENTIFICATION:-}" "${LC_MEASUREMENT:-}" "${LC_MESSAGES:-}" \
  "${LC_MONETARY:-}" "${LC_NAME:-}" "${LC_NUMERIC:-}" "${LC_PAPER:-}" \
  "${LC_TELEPHONE:-}" "${LC_TIME:-}"; do
  case "$forwarded" in '' | C | C.* | POSIX) continue ;; esac
  if ! printf '%s\n' "$available" | grep -Fqix "$(printf '%s' "$forwarded" | sed 's/UTF-8$/utf8/')"; then
    export LANG=C.UTF-8
    unset LC_ALL LC_ADDRESS LC_COLLATE LC_CTYPE LC_IDENTIFICATION \
      LC_MEASUREMENT LC_MESSAGES LC_MONETARY LC_NAME LC_NUMERIC LC_PAPER \
      LC_TELEPHONE LC_TIME
    break
  fi
done
unset available forwarded

# The rest is for a person at a prompt.
case $- in *i*) ;; *) return 0 2>/dev/null || exit 0 ;; esac

backend="not started"
if [ -f "${WORKSPACE_ROOT:-$PWD}/examples/drupal/.env" ]; then
  port="$(sed -n 's/^WEBSERVER_PORT=//p' "${WORKSPACE_ROOT:-$PWD}/examples/drupal/.env" | head -1)"
  [ -n "$port" ] && backend="http://127.0.0.1:${port} (see examples/drupal/.devtools/info)"
  unset port
fi

cat <<SUMMARY

druxt.js
  yarn build            Build all packages
  yarn test:unit        Unit tests
  yarn lint             Lint

Umami example backend: ${backend}
  cd examples/drupal && make build   Provision and start it (SQLite, no Docker)
  cd examples/drupal && make stop    Stop it

SUMMARY
