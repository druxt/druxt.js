#!/usr/bin/env bash
if [ -n "$DEBUG_DRUXTJS" ]; then
    set -x
fi

# Set up ddev for use on gitpod

set -eu -o pipefail

DDEV_DIR="${GITPOD_REPO_ROOT}/examples/drupal/.ddev"
mkdir -p "$DDEV_DIR"

cat <<CONFIGEND > "${DDEV_DIR}"/config.yaml
#gitpod-generated
name: druxtjs
type: drupal9
docroot: web
php_version: "7.4"
webserver_type: nginx-fpm
router_http_port: "80"
router_https_port: "443"
xdebug_enabled: false
additional_hostnames: []
additional_fqdns: []
mariadb_version: "10.3"
mysql_version: ""
use_dns_when_possible: true
composer_version: ""
web_environment: []
CONFIGEND

# Generate a config.gitpod.yaml that adds the gitpod
# proxied ports so they're known to ddev.
shortgpurl="${GITPOD_WORKSPACE_URL#'https://'}"

cat <<CONFIGEND > "${DDEV_DIR}"/config.gitpod.yaml
#ddev-gitpod-generated
use_dns_when_possible: false
# Throwaway ports, otherwise Gitpod throw an error 'port needs to be > 1024'
router_http_port: "8888"
router_https_port: "8889"
additional_fqdns:
- 8888-${shortgpurl}
- 8025-${shortgpurl}
- 8036-${shortgpurl}
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
    # This adds 8080 on the host (bound on all interfaces)
    # It goes directly to the web container without
    # ddev-nginx
    ports:
    - 8080:80
COMPOSEEND

# Misc housekeeping before start
ddev config global --instrumentation-opt-in=true --router-bind-all-interfaces=true

cd "$DDEV_DIR" && ddev start

# Ignore dynamically generated ddev files
echo 'config.yaml' >> "$DDEV_DIR"/.gitignore
echo 'docker-compose.host-docker-internal.yaml' >> "$DDEV_DIR"/.gitignore
