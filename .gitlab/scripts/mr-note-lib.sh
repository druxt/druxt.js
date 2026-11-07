#!/usr/bin/env bash
# Shared helpers for the merge-request note scripts. Sourced, not executed.
#
# Environment:
#   GITLAB_API_TOKEN       required by every caller. See require_token.
#   CI_API_V4_URL          required. Set by GitLab CI.
#   CI_PROJECT_ID          required. Set by GitLab CI. Never defaulted to a
#                          literal: that works in one repository and is
#                          silently wrong in every other.
#   CI_MERGE_REQUEST_IID   required. Only set on merge-request pipelines.
#   MR_NOTE_INTERPRETER    optional. Force `python3` or `node` for JSON
#                          parsing. Auto-detected otherwise; exists so the
#                          tests can exercise both branches.
#
# Why two interpreters: these scripts run in two different images. The visual
# and preview jobs need node, because Playwright and the application build do.
# The workspace's own pipeline runs on a python image. A script that assumed
# either works in one and fails in the other, and it fails by finding no note
# at all, so every run posts a duplicate instead of erroring.

# Fail before anything reaches the network. Without this the request goes out
# unauthenticated and comes back as an opaque 401, which reads as an outage
# rather than as a missing variable.
require_token() {
  if [ -z "${GITLAB_API_TOKEN:-}" ]; then
    echo "GITLAB_API_TOKEN is not set; refusing to call the API." >&2
    return 1
  fi
}

# Echo the interpreter to parse JSON with, or fail naming both candidates.
json_interpreter() {
  local forced="${MR_NOTE_INTERPRETER:-}"
  if [ -n "$forced" ]; then
    if command -v "$forced" >/dev/null 2>&1; then
      printf '%s' "$forced"
      return 0
    fi
    echo "MR_NOTE_INTERPRETER=${forced} is not executable." >&2
    echo "Set it to python3 or node, or unset it to auto-detect." >&2
    return 1
  fi
  if command -v python3 >/dev/null 2>&1; then
    printf 'python3'
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    printf 'node'
    return 0
  fi
  echo "Neither python3 nor node is available to parse the API response." >&2
  return 1
}

# The id of the note carrying $1, read from JSON on stdin. Empty when none.
#
# Matching on the marker rather than the body means another job's note is
# never hijacked. An unparseable body yields no id, which makes the caller
# create a note rather than update an unknown one.
note_id_for() {
  local marker="$1" interpreter
  interpreter="$(json_interpreter)" || return 1

  if [ "$interpreter" = "python3" ]; then
    python3 -c '
import json, sys

marker = sys.argv[1]
try:
    notes = json.load(sys.stdin)
except Exception:
    notes = []
if not isinstance(notes, list):
    notes = []
for note in notes:
    if isinstance(note, dict) and marker in (note.get("body") or ""):
        sys.stdout.write(str(note.get("id", "")))
        break
' "$marker"
  else
    node -e '
const fs = require("fs");
const marker = process.argv[1];
let notes = [];
try {
  const parsed = JSON.parse(fs.readFileSync(0, "utf8"));
  if (Array.isArray(parsed)) notes = parsed;
} catch { /* an unparseable body means no note to match */ }
const match = notes.find((n) => n && n.body && n.body.includes(marker));
process.stdout.write(match ? String(match.id) : "");
' "$marker"
  fi
}

# Echo the notes endpoint for this merge request.
notes_url() {
  local api project iid
  api="${CI_API_V4_URL:?CI_API_V4_URL is not set}"
  project="${CI_PROJECT_ID:?CI_PROJECT_ID is not set}"
  iid="${CI_MERGE_REQUEST_IID:?CI_MERGE_REQUEST_IID is not set; this job needs a merge-request pipeline}"
  printf '%s/projects/%s/merge_requests/%s/notes' "$api" "$project" "$iid"
}

# curl with retries and the token header, as an array to expand at the call
# site. The token is passed as a header value, never on a URL, so it does not
# land in a log line that echoes the request target. --fail makes an HTTP
# error, such as a 401 on an expired token, fail the call rather than hand
# its error body on as if it were the answer, and -S prints curl's reason.
api_curl() {
  curl -sS --fail --retry 3 --retry-delay 2 --max-time 30 \
    --header "PRIVATE-TOKEN: ${GITLAB_API_TOKEN}" "$@"
}
