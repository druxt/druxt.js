#!/usr/bin/env bash
#
# Dev container setup: monorepo and docs-site dependencies. Drupal
# backends are not provisioned here; use DDEV locally or a quickstart
# repository for a backend.
set -euo pipefail

echo "==> Trusting this repo's .mise.toml"
mise trust

echo "==> Enabling corepack (Yarn 3, pinned by the packageManager field)"
corepack enable

echo "==> Installing monorepo dependencies"
yarn install

echo "==> Installing documentation site dependencies"
(cd docs/nuxt && yarn install)

cat <<'EOF'

Ready. Common tasks:
  yarn build            Build all packages
  yarn test:unit        Run the unit test suite
  yarn lint             Lint
  yarn build:docs       Generate the API documentation
  cd docs/nuxt && yarn dev   Run the druxtjs.org site locally

EOF
