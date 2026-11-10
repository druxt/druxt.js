#!/usr/bin/env bash
# Post a VS Code server URL to the merge request.
#
# Usage: post-vscode-tunnel-comment.sh <url> [keep-alive-minutes] [auth]
#
# The note carries the URL and never the password. A note is readable by
# everyone who can see the merge request, which is a wider set than the people
# who should be able to open a shell on the runner, so the way in stays in the
# job log where only someone who can read the pipeline will find it.
#
# Environment:
#   GITLAB_API_TOKEN       required. A token with api scope.
#   CI_API_V4_URL          required. Set by GitLab CI.
#   CI_PROJECT_ID          required. Set by GitLab CI, never defaulted here.
#   CI_MERGE_REQUEST_IID   required. Only set on merge-request pipelines.
#   CI_COMMIT_SHORT_SHA    reported, so a reader knows what is checked out.
#   CI_JOB_URL             linked, so the reader can reach the password.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

url="${1:?usage: post-vscode-tunnel-comment.sh <url> [minutes] [auth]}"
minutes="${2:-55}"
auth="${3:-password}"

marker="<!-- vscode-tunnel -->"
body_file="$(mktemp)"
# Removed on every exit, a failed post included.
trap 'rm -f "$body_file"' EXIT
{
  echo "$marker"
  echo "### VS Code server at \`${CI_COMMIT_SHORT_SHA:-unknown}\`"
  echo
  echo "| | |"
  echo "| --- | --- |"
  echo "| Editor | ${url} |"
  if [ "$auth" = "none" ]; then
    echo "| Sign in | Cloudflare Access |"
  else
    echo "| Password | In the [job log](${CI_JOB_URL:-the manual job}), not here |"
  fi
  echo
  echo "This is a live editor on the runner, holding this branch's checkout."
  echo "It closes when the job ends, in about ${minutes} minutes."
  echo "Re-run the manual job for a fresh one."
} > "$body_file"

bash "$script_dir/upsert-mr-note.sh" "$marker" "$body_file"

echo "Posted VS Code server URL: ${url}"
