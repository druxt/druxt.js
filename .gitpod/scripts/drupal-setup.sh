#!/usr/bin/env bash
if [ -n "$DEBUG_DRUXTJS" ]; then
    set -x
fi

# Set up ddev for use on gitpod

set -eu -o pipefail

DRUPAL_DIR="${GITPOD_REPO_ROOT}/docs/drupal"

# Set up Drupal website
cd "$DRUPAL_DIR" && ddev start -y
cd "$DRUPAL_DIR" && ddev drupal-install
