---
name: verify-change
description: Runs the druxt.js verification gate (lint, build, unit tests and the checks for whatever else changed) and reports the real results. Use when a druxt.js lint, build or test check fails, when about to commit or open or update a pull request, or before saying a change is done, fixed or passing.
---

# Verify a change

A change is done when the checks CI runs have passed on your machine, in this session, and you can show the output. A check you have not run has not passed.

## The gate

Run it from the repository root, in this order, for every change:

```bash
yarn lint && yarn build && yarn test:unit
```

`yarn build` must produce `dist/` output for every package. CI builds before it runs the unit tests, so do the same.

## Checks for what changed

| What changed                           | Also run                                                        |
| -------------------------------------- | --------------------------------------------------------------- |
| Any Markdown, including changesets     | `yarn lint:md`, `yarn lint:prose`, `yarn lint:cspell`           |
| Source comments or JSDoc               | `yarn lint:prose`, `yarn lint:cspell`                           |
| `package.json` or `yarn.lock`          | `yarn install --immutable`, `yarn lint:knip`, `yarn lint:audit` |
| `renovate.json`                        | `yarn lint:renovate`                                            |
| `examples/` manifests                  | `yarn lint:examples`                                            |
| Package output size                    | `yarn bundlewatch`, after `yarn build`                          |
| `.agents/skills/` or `scripts/skills/` | `yarn lint:skills`, `yarn lint:skills:test`                     |
| `scripts/commits/`                     | `yarn lint:commits:test`                                        |
| `scripts/release/`                     | `yarn release:check:test`                                       |
| `scripts/perf-audit/`                  | `yarn perf:audit:test` under Node 22                            |

The end-to-end tests run in CI against a Drupal backend. To run them locally, start the backend with `cd examples/drupal && make build`, then run `yarn example:druxt-site:test`. See `examples/drupal/.devtools/README.md`.

## Failing checks

- Fix the cause. Leave the check, its configuration and its threshold as they are.
- Never skip the git hooks, delete or skip a test, or add an `eslint-disable` comment to get a check to pass.
- If a check is wrong, fix the check in a separate commit and say why in the pull request.
- If it also fails on a clean `develop`, it is not your change's failure. Say so, with the output from both runs.

## Commits

The `pre-commit`, `commit-msg` and `pre-push` hooks run a subset of these checks. Let them run. Commit under the git identity of the person you work for. Leave AI attribution out of the message, such as a `Co-Authored-By: Claude` trailer or a session link. `yarn lint:commits --range upstream/develop..HEAD` checks the branch's commits.

## Report

State each command and its result, with the failing output when there is any. Write "the gate passed" only after it has passed in this session. When you could not run a check, name it and say why.
