#!/usr/bin/env bash
#
# The parts of the dev container image that no published feature covers. It
# runs as root while the image is built, after the PHP and apt features.
set -euo pipefail

# The PHP feature installs here and adds it to the PATH of the finished
# container, which a later feature's build step does not always inherit.
export PATH="/usr/local/php/current/bin:${PATH}"

CONF_DIR="$(php --ini | grep 'Scan for additional .ini files' | sed 's/.*: *//')"

# Xdebug is installed by the PHP feature and would start on every request.
echo 'xdebug.start_with_request = trigger' > "${CONF_DIR}/zz-xdebug-trigger.ini"

# The PHP feature leaves gd out, and Drupal's installer requires it. Built
# from the extension's own directory in the source of the PHP installed.
PHP_FULL_VERSION="$(php -r 'echo PHP_VERSION;')"
PHP_SRC_TMP="$(mktemp -d)"
trap 'rm -rf "${PHP_SRC_TMP}"' EXIT
mkdir -p "${PHP_SRC_TMP}/gd"
curl -fsSL "https://www.php.net/distributions/php-${PHP_FULL_VERSION}.tar.gz" -o "${PHP_SRC_TMP}/php-src.tar.gz"
tar -xzf "${PHP_SRC_TMP}/php-src.tar.gz" -C "${PHP_SRC_TMP}/gd" --strip-components=3 "php-${PHP_FULL_VERSION}/ext/gd"
(
  cd "${PHP_SRC_TMP}/gd"
  phpize > /dev/null
  ./configure --with-jpeg --with-webp --with-freetype > /dev/null
  make -j"$(nproc)" > /dev/null
  make install > /dev/null
)
echo 'extension=gd' > "${CONF_DIR}/gd.ini"

# The PHP feature builds sodium as a shared module but never enables it, and
# simple_oauth's lcobucci/jwt requires it.
echo 'extension=sodium' > "${CONF_DIR}/sodium.ini"

php -r "exit(extension_loaded('gd') && extension_loaded('pdo_sqlite') && extension_loaded('sodium') ? 0 : 1);" || {
  echo "gd, pdo_sqlite or sodium is not loaded" >&2
  exit 1
}

# OpenSSH forwards the host's LANG and LC_*, and bash warns on every start
# when that locale is not generated here. These are the usual English ones.
sed -i -E 's/^# (en_(AU|CA|GB|IE|NZ|US)\.UTF-8 UTF-8)/\1/' /etc/locale.gen
locale-gen > /dev/null
