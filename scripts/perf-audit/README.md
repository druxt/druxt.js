# Performance audit

Measures the example applications per route and compares each run with the baseline for the environment it runs in.

| Layer         | Metrics                                                                                              | Source                                                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend       | requests per server render, cold and warm, by endpoint                                               | the audit's own proxy log (`backend-proxy.mjs`), started by `serve-examples.sh` on port 8890; the examples are built with `BASE_URL` pointed at it, so every backend call in these timings includes one extra local hop |
| Server render | time to first byte, HTML bytes, inline `__NUXT__` bytes, `data-fetch-key` count, status, error state | one fetch per route against `nuxt start`                                                                                                                                                                                |
| Browser       | Lighthouse performance, LCP, CLS, TBT, FCP, requests, bytes, API calls after load                    | Unlighthouse CI                                                                                                                                                                                                         |

## Run it

The audit needs Node 18 or later. The examples build under Node 16.

    examples/drupal/.devtools/start
    yarn build
    scripts/perf-audit/serve-examples.sh start
    mise exec node@22 -- yarn perf:audit
    scripts/perf-audit/serve-examples.sh stop

`yarn build` and `serve-examples.sh` both run under Node 16. After a run,
`examples/*/.nuxt` is built against the proxy port, not the real backend;
rebuild the examples before using them for anything else.

Flags: `--example <name>` (repeatable), `--skip-lighthouse`, `--update-baseline`, `--out <dir>`.

Reports are written to `.perf/<timestamp>/report.md` and `report.json`. Budgets are in `config.mjs`, and a breach exits 1.

## Each release

1. Run the audit on the release candidate.
2. Read the deltas against the previous release.
3. `mise exec node@22 -- yarn perf:audit --update-baseline` and commit the baseline with the release.

## One baseline per environment

Lighthouse scores and timings depend on the machine, so a run is only compared with a baseline recorded in the same environment.

| Environment | Baseline                    | Chosen when          |
| ----------- | --------------------------- | -------------------- |
| `local`     | `perf/baseline.local.json`  | nothing else matches |
| `github`    | `perf/baseline.github.json` | `GITHUB_ACTIONS`     |
| `gitlab`    | `perf/baseline.gitlab.json` | `GITLAB_CI`          |

`PERF_AUDIT_ENV` overrides the name, for a machine that needs its own baseline. An environment with no baseline yet reports its numbers without deltas or breaches.

To update a CI baseline, run the GitHub workflow with `update_baseline` ticked, or play the gitlab job with `PERF_AUDIT_UPDATE_BASELINE=true`. The job keeps `perf/` in its artifact. Download the file and commit it.

In CI the manual gitlab `perf:audit` job and the GitHub `Performance audit` workflow do the same and keep `.perf/` as an artifact. On GitHub, add the `perf-audit` label to a pull request to run it on that branch, or use `Run workflow` (with optional example and skip-Lighthouse inputs) once the workflow is on the default branch.

## Comments on the merge request

A run started from the pipeline of a merge request comments the summary on it, provided
`PERF_AUDIT_GITLAB_TOKEN` is set as a masked project variable holding a project
access token with `api` scope. A run on GitHub comments on the open pull request
for the branch, using the workflow's own token. Either way a later run edits the
same comment instead of adding a new one. Commenting never fails the job.
