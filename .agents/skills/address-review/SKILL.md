---
name: address-review
description: Works through review comments and failing CI on a druxt.js pull request, fixing or answering each one until the pull request is green and every thread has a reply. Use when a druxt.js pull request has review comments, requested changes, bot findings or a failing check, including a request to re-run CI until it passes.
---

# Address review

A pull request is ready to merge when CI is green on its latest commit and every review thread has an answer. Work through both.

## 1. Collect everything open

```bash
gh pr view <number> --repo druxt/druxt.js --comments
gh pr checks <number> --repo druxt/druxt.js
gh api repos/druxt/druxt.js/pulls/<number>/comments --paginate
```

`gh pr view` shows review summaries but not inline review comments, so the `gh api` call lists those, replies included. Read every inline comment, review summary, bot finding and failing check. A finding from a bot is a bug report like any other.

## 2. Fix CI first

For each failing check, reproduce it locally with the same command CI runs (the `verify-change` skill lists them), find the cause and fix it. When a test fails because of a behaviour change in a commit you didn't write, read the whole commit message and ask its author whether the change is meant to happen before you touch the test. Until they answer, treat the code as the thing to fix. Re-running a job until it passes is not a fix. If the check also fails on the release line, say so on the pull request with the evidence and leave it to the maintainers.

## 3. Answer every comment

For each comment:

1. Check the claim against the code before changing anything. Reviewers can be wrong, and so can you.
2. If it is correct and small (a rename, a missing test, a clearer `@param`), fix it.
3. If it asks for a larger change (a new API, a refactor across packages, a design change), reply with a proposal and wait for the reviewer.
4. If it is wrong, reply with the reason and the evidence.

Reply on the thread itself, naming the commit that fixes it. Draft the replies and post them when the person you work for asks you to.

## 4. Push and re-verify

Add new commits on top of the branch, so reviewers can see what changed since their review. Re-run the `verify-change` gate, push, then ask the reviewer to look again.

```bash
git push origin <branch>
```

Repeat until CI is green and no thread is waiting on you.
