#!/usr/bin/env bash
# Delete the merge-request note carrying a marker, if one exists.
#
# Usage: delete-mr-note.sh <marker>
#
# The counterpart to upsert-mr-note.sh. A failure note that stays after the
# failure is fixed is worse than no note: it reports a problem that no longer
# exists, and a reviewer has no way to tell it is stale.
#
# Absence of a matching note is success, not an error: the common case is a
# pipeline that never failed in the first place.
#
# Environment: see mr-note-lib.sh.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scaffold/standards/gitlab-scripts/mr-note-lib.sh
. "$script_dir/mr-note-lib.sh"

marker="${1:?usage: delete-mr-note.sh <marker>}"

require_token

url="$(notes_url)"
existing_id="$(api_curl "${url}?per_page=100" | note_id_for "$marker")"

if [ -n "$existing_id" ]; then
  api_curl --request DELETE "${url}/${existing_id}" > /dev/null
  echo "Deleted merge-request note ${existing_id}"
else
  echo "No note carries ${marker}; nothing to delete."
fi
