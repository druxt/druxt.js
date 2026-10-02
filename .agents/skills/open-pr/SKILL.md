---
name: open-pr
description: Prepares and opens a druxt.js pull request from a contributor's fork against develop, with a Conventional Commits title and the repository's template filled in. Use when a druxt.js change is ready for review, or when asked to open a pull request or to write its title or description.
---

# Open a pull request

Pull requests go from a branch on your fork to `develop` on [druxt/druxt.js](https://github.com/druxt/druxt.js). Push and open one only when the person you work for asks you to.

## Before opening

1. The `verify-change` skill has passed in this session, and you have its output.
2. A changeset is committed if a published package changed (see the `add-changeset` skill).
3. The commits follow Conventional Commits, scoped by the issue number when there is one and by the package name otherwise. The commit-msg hook enforces the format, so let it run.
4. The branch is up to date with `develop`. Merge `upstream/develop` into it, then re-run the gate.
5. The commits are authored and committed under your own git identity, with no AI attribution lines. `yarn lint:commit --from upstream/develop --to HEAD` checks the messages, and the `pre-push` hook checks the identity too.

## Title

Pull requests are squash merged, and the title becomes the commit on `develop`. Write it as a Conventional Commits subject that says what changes for a Druxt user:

```text
fix(#412): render nothing for a menu with no items
feat(router): resolve paths with a trailing slash
```

The scope is the issue number when there is one (`fix(#412): …`), and otherwise the package directory name (`menu`, `router`, `druxt`). Leave the scope out for a change across several packages with no issue.

## Description

Fill in every section of `.github/PULL_REQUEST_TEMPLATE.md`:

- **Types of changes**: tick the boxes that apply.
- **Description**: what changed and why, with a `Resolves: #123` line for the issue. Include the spec when there is one, and list the commands you ran to verify the change with their results.
- **Checklist**: tick only what is true. If a box does not apply, say why.
- **Screenshots/Media**: add these for anything visible in a browser.

Ask a maintainer for the `perf-audit` label when the change touches a store, the Druxt client, a Nuxt module or how components fetch data. The audit then posts its numbers on the pull request.

## Open it

```bash
git push -u origin <branch>
gh pr create --repo druxt/druxt.js --base develop --head <your-user>:<branch> \
  --title "fix(#412): render nothing for a menu with no items" --body-file <description.md>
```

Without the `gh` CLI, open the compare page that `git push` prints.

## After opening

CI runs on the pull request. A red check is yours to fix before review starts, using the `address-review` skill. Maintainers review, label and merge, so do not merge, label or request reviewers on their behalf.
