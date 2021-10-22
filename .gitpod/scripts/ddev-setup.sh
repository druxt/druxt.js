#!/usr/bin/env bash
if [ -n "$DEBUG_DRUXTJS" ]; then
    set -x
fi

# Set up ddev for use on gitpod

set -eu -o pipefail

DDEV_DIR="${GITPOD_REPO_ROOT}/examples/drupal/drupal-9/.ddev"
shortgpurl="${GITPOD_WORKSPACE_URL#'https://'}"

# Generate a config.gitpod.yaml that adds the gitpod
# proxied ports so they're known to ddev.

cat <<CONFIGEND > "${DDEV_DIR}"/config.gitpod.yaml
#ddev-gitpod-generated
bind_all_interfaces: true
host_webserver_port: 8080
CONFIGEND

# We need host.docker.internal inside the container,
# So add it via docker-compose.host-docker-internal.yaml
hostip=$(awk "\$2 == \"$HOSTNAME\" { print \$1; }" /etc/hosts)

cat <<COMPOSEEND >"${DDEV_DIR}"/docker-compose.host-docker-internal.yaml
#ddev-gitpod-generated
version: "3.6"
services:
  web:
    environment:
      - DRUSH_OPTIONS_URI=$(gp url 8080)
    extra_hosts:
    - "host.docker.internal:${hostip}"
COMPOSEEND

# Misc housekeeping before start
ddev config global --instrumentation-opt-in=true --omit-containers=ddev-router
