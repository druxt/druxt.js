#!/usr/bin/env bash
#
# Dev container setup: monorepo dependencies. Drupal backends are not
# provisioned here; use DDEV locally or a quickstart repository for a
# backend.
set -euo pipefail

echo "==> Trusting this repo's .mise.toml"
mise trust

echo "==> Enabling corepack (Yarn 3, pinned by the packageManager field)"
corepack enable

echo "==> Installing monorepo dependencies"
yarn install

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
