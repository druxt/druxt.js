#!/usr/bin/env bash
if [ -n "$DEBUG_DRUXTJS" ]; then
    set -x
fi

# Set up ddev for use on gitpod

set -eu -o pipefail

DRUPAL_DIR="${GITPOD_REPO_ROOT}/examples/drupal/drupal-9"

# Set up DDEV
cd "$GITPOD_REPO_ROOT" && .gitpod/scripts/ddev-setup.sh

# Set up Drupal website
cd "$DRUPAL_DIR" && ddev start
cd "$DRUPAL_DIR" && ddev composer install
cd "$DRUPAL_DIR" && ddev drush si -y --account-pass=admin demo_umami
cd "$DRUPAL_DIR" && ddev drush -y en druxt
cd "$DRUPAL_DIR" && ddev drush "rap anonymous 'access druxt resources'"
cd "$DRUPAL_DIR" && ddev drush -y config:set jsonapi.settings read_only 0
cd "$DRUPAL_DIR" && ddev stop
