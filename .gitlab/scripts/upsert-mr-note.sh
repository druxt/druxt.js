#!/usr/bin/env bash
# Create or update a merge-request note identified by a hidden marker.
#
# Usage: upsert-mr-note.sh <marker> <body-file>
#
# The marker is an HTML comment the note carries, so the next run finds its own
# note and edits it rather than adding another. A job that posts on every
# pipeline run buries the merge request within a day otherwise.
#
# Environment: see mr-note-lib.sh. GITLAB_API_TOKEN, CI_API_V4_URL,
# CI_PROJECT_ID and CI_MERGE_REQUEST_IID are all required.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scaffold/standards/gitlab-scripts/mr-note-lib.sh
. "$script_dir/mr-note-lib.sh"

marker="${1:?usage: upsert-mr-note.sh <marker> <body-file>}"
body_file="${2:?usage: upsert-mr-note.sh <marker> <body-file>}"

require_token

if [ ! -f "$body_file" ]; then
  echo "Body file not found: $body_file" >&2
  exit 1
fi

url="$(notes_url)"
existing_id="$(api_curl "${url}?per_page=100" | note_id_for "$marker")"

if [ -n "$existing_id" ]; then
  api_curl --request PUT --form "body=<${body_file}" "${url}/${existing_id}" > /dev/null
  echo "Updated merge-request note ${existing_id}"
else
  api_curl --request POST --form "body=<${body_file}" "${url}" > /dev/null
  echo "Created merge-request note"
fi
