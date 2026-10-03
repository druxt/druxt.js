#!/bin/bash
# Sets up a Claude Code on the web session: the pinned Node and Yarn, the
# dependencies and git hooks (yarn install runs husky install), and a build,
# because the unit tests load built packages. Local sessions use mise and
# make setup instead, so this exits early outside the web.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# The versions pinned in .mise.toml and package.json packageManager.
NODE_VERSION="$(sed -n 's/^node = "\(.*\)"/\1/p' .mise.toml)"
YARN_VERSION="$(sed -n 's/.*"packageManager": "yarn@\(.*\)".*/\1/p' package.json)"

NODE_DIR="/opt/node-v${NODE_VERSION}-linux-x64"
if [ ! -x "$NODE_DIR/bin/node" ]; then
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" | tar -xJ -C /opt
fi
export PATH="$NODE_DIR/bin:$PATH"

# Corepack downloads Yarn from repo.yarnpkg.com, which hosted sessions can't
# reach, so install the same Yarn release from the npm registry instead.
if [ "$(yarn --version 2>/dev/null || true)" != "$YARN_VERSION" ]; then
  npm install --global "@yarnpkg/cli-dist@${YARN_VERSION}" --no-audit --no-fund
fi

# The Cypress binary download is blocked too, and the end-to-end tests need a
# Drupal backend that these sessions don't run.
export CYPRESS_INSTALL_BINARY=0

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export PATH=\"$NODE_DIR/bin:\$PATH\""
    echo "export CYPRESS_INSTALL_BINARY=0"
  } >> "$CLAUDE_ENV_FILE"
fi

yarn install
yarn build
