#!/usr/bin/env bash
if [ -n "$DEBUG_DRUXTJS" ]; then
    set -x
fi

# Set up ddev for use on gitpod

set -eu -o pipefail

DRUPAL_DIR="${GITPOD_REPO_ROOT}/examples/drupal/drupal-9"

# Set up Drupal website
cd "$DRUPAL_DIR" && ddev start -y
cd "$DRUPAL_DIR" && ddev drupal-install
