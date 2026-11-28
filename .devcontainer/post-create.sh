#!/usr/bin/env bash
#
# Dev container setup: the parts that depend on the checkout. The tools and
# PHP come from the prebuilt image, defined in .github/.devcontainer. The
# example backend is not provisioned here: run `make build` in
# examples/drupal when you want it.
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

# The examples and the unit tests load the built packages, so a container
# without a build fails at the first `yarn test:unit` or example.
echo "==> Building the packages"
yarn build

echo "==> Installing Vale and its styles, for the prose lint and its editor extension"
yarn lint:prose:install

# The image carries PHP with gd, sodium and Xdebug in trigger mode, and the
# English locales. This check is here to say so plainly when a container was
# built from something else, such as an image from before a change to
# .github/.devcontainer.
php -r "exit(extension_loaded('gd') && extension_loaded('pdo_sqlite') && extension_loaded('sodium') ? 0 : 1);" || {
  echo "gd, pdo_sqlite or sodium is not loaded: the dev container image is not the one this checkout expects" >&2
  exit 1
}

# Sourced from ~/.bashrc rather than run once here, so every new terminal
# gets the locale fix and the summary, not only the creation log.
echo "==> Installing the shell locale fallback and welcome"
if ! grep -qF '.devcontainer/shell-init.sh' ~/.bashrc; then
  printf '\n# Dev container shell setup: locale fallback and welcome.\nexport WORKSPACE_ROOT=%q\n[ -f "$WORKSPACE_ROOT/.devcontainer/shell-init.sh" ] && . "$WORKSPACE_ROOT/.devcontainer/shell-init.sh"\n' "$PWD" >> ~/.bashrc
fi

echo
echo "Ready. Open a new terminal for the summary of commands."
