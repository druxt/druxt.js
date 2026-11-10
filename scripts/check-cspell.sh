#!/usr/bin/env sh
# cspell over this checkout. Run from a worktree under .worktrees/ it checks
# nothing, because the repository's exclude file ignores that directory and
# cspell honours it, so this copies HEAD to a scratch worktree first.
set -eu
root="$(git rev-parse --show-toplevel)"
scratch="$(mktemp -d)/cspell"
git -C "$root" worktree add -q --detach "$scratch" HEAD
trap 'git -C "$root" worktree remove --force "$scratch"' EXIT
cd "$scratch"
# Captured first, so set -e sees cspell's own status: a pipe into grep would
# report grep's, and a run full of spelling errors still prints a file count.
out="$(node "$root/node_modules/cspell/bin.mjs" lint --no-progress --no-must-find-files --gitignore --dot \
  "**/*.{js,mjs,ts,vue,json,md,yml,yaml}" "scripts/**/*.sh" 2>&1)" || { printf '%s\n' "$out" >&2; exit 1; }
printf '%s\n' "$out" >&2
printf '%s\n' "$out" | grep -q 'Files checked: [1-9]'
