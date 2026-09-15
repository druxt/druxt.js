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

cat <<'EOF'

Ready. Common tasks:
  yarn build            Build all packages
  yarn test:unit        Run the unit test suite
  yarn lint             Lint

EOF
