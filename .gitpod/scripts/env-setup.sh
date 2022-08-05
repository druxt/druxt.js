#!/usr/bin/env bash
set -eu -o pipefail

echo -en "OAUTH_CALLBACK=https://3000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}/callback" > docs/.env
