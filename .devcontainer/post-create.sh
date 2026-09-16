#!/usr/bin/env bash
#
# Dev container setup: monorepo dependencies and the PHP the example
# backend needs. The backend itself is not provisioned here: run
# `make build` in examples/drupal when you want it.
#
# Idempotent: a devcontainer gets rebuilt, and a post-create step that only
# works on a clean container is a step that fails the second time.
set -euo pipefail

echo "==> Trusting this repo's .mise.toml"
mise trust

echo "==> Enabling corepack (Yarn 3, pinned by the packageManager field)"
corepack enable

echo "==> Installing monorepo dependencies"
yarn install

# PHP comes from the dev container PHP feature. It ships Xdebug active on
# every request, so each CLI call would warn that no debugger is listening;
# trigger mode keeps it available on demand. gd is missing from the
# feature and Drupal's installer requires it, so it is built from PHP's own
# source tree. Same steps as module-template.
CONF_DIR=$(php --ini | grep 'Scan for additional .ini files' | sed 's/.*: *//')
echo 'xdebug.start_with_request = trigger' | sudo tee "$CONF_DIR/zz-xdebug-trigger.ini" > /dev/null

echo "==> Building the gd extension from PHP's source tree"
PHP_FULL_VERSION=$(php -r 'echo PHP_VERSION;')
PHP_SRC_TMP="$(mktemp -d)"
trap 'rm -rf "$PHP_SRC_TMP"' EXIT
mkdir -p "$PHP_SRC_TMP/gd"
curl -fsSL "https://www.php.net/distributions/php-${PHP_FULL_VERSION}.tar.gz" -o "$PHP_SRC_TMP/php-src.tar.gz"
tar -xzf "$PHP_SRC_TMP/php-src.tar.gz" -C "$PHP_SRC_TMP/gd" --strip-components=3 "php-${PHP_FULL_VERSION}/ext/gd"
(
  cd "$PHP_SRC_TMP/gd"
  phpize > /dev/null
  ./configure --with-jpeg --with-webp --with-freetype > /dev/null
  make -j"$(nproc)" > /dev/null
  sudo make install > /dev/null
)
echo 'extension=gd' | sudo tee "$CONF_DIR/gd.ini" > /dev/null
php -r "exit(extension_loaded('gd') && extension_loaded('pdo_sqlite') ? 0 : 1);" || { echo "gd or pdo_sqlite is not loaded" >&2; exit 1; }

# OpenSSH forwards the host's LANG and LC_*, and bash warns on every start
# when that locale is not generated here. Cover the usual English ones;
# shell-init.sh falls back for anything else.
echo "==> Generating the English locales hosts commonly send over SSH"
sudo apt-get update -qq > /dev/null
sudo apt-get install -y -qq locales > /dev/null
sudo sed -i -E 's/^# (en_(AU|CA|GB|IE|NZ|US)\.UTF-8 UTF-8)/\1/' /etc/locale.gen
sudo locale-gen > /dev/null

# Sourced from ~/.bashrc rather than run once here, so every new terminal
# gets the locale fix and the summary, not only the creation log.
echo "==> Installing the shell locale fallback and welcome"
if ! grep -qF '.devcontainer/shell-init.sh' ~/.bashrc; then
  printf '\n# Dev container shell setup: locale fallback and welcome.\nexport WORKSPACE_ROOT=%q\n[ -f "$WORKSPACE_ROOT/.devcontainer/shell-init.sh" ] && . "$WORKSPACE_ROOT/.devcontainer/shell-init.sh"\n' "$PWD" >> ~/.bashrc
fi

echo
echo "Ready. Open a new terminal for the summary of commands."
