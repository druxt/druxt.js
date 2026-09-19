# Performance audit

Measures the example applications per route and compares each run with the baseline for the environment it runs in.

| Layer         | Metrics                                                                                              | Source                                                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend       | requests per server render, cold and warm, by endpoint                                               | the audit's own proxy log (`backend-proxy.mjs`), started by `serve-examples.sh` on port 8890; the examples are built with `BASE_URL` pointed at it, so every backend call in these timings includes one extra local hop |
| Server render | time to first byte, HTML bytes, inline `__NUXT__` bytes, `data-fetch-key` count, status, error state | one fetch per route against `nuxt start`                                                                                                                                                                                |
| Browser       | Lighthouse performance, LCP, CLS, TBT, FCP, requests, bytes, API calls after load                    | Unlighthouse CI                                                                                                                                                                                                         |
| Hydration     | server-rendered Druxt nodes discarded after hydration, layout shift, median of three throttled loads | Chrome over the DevTools protocol, no extra dependency; counts `[data-fetch-key]` nodes present at DOMContentLoaded that are gone once the page settles                                                                 |

## Run it

The audit runs under Node 22. Node 18 also works with `--skip-hydration`. The examples build under Node 16, like the rest of the repository.

    examples/drupal/.devtools/start
    yarn build
    scripts/perf-audit/serve-examples.sh start
    mise exec node@22 -- yarn perf:audit
    scripts/perf-audit/serve-examples.sh stop

`yarn build` and `serve-examples.sh` both run under Node 16. After a run,
`examples/*/.nuxt` is built against the proxy port, not the real backend;
rebuild the examples before using them for anything else.

Flags: `--example <name>` (repeatable), `--skip-lighthouse`, `--skip-hydration`, `--update-baseline`, `--out <dir>`.

The Lighthouse and hydration layers need `CHROME_PATH`. The hydration layer also needs Node 22 for its WebSocket client.

Reports are written to `.perf/<timestamp>/report.md` and `report.json`.

## Budgets

A breach exits 1. The CI jobs are advisory, so a breach marks the job and the comment without blocking a merge. The values are in `config.mjs`.

| Budget                                   | Breach means                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Backend requests per render may not rise | a server render makes more calls to Drupal than the baseline did               |
| API calls after load may not rise        | the browser fetches data again that the server already rendered                |
| Discarded nodes may not rise             | the browser throws away server-rendered Druxt components and builds them again |
| Performance may drop at most 10 points   | the Lighthouse score fell further than its run to run noise                    |
| Inline payload may grow at most 10%      | the `__NUXT__` state in the HTML grew                                          |
| Every route answers 200 with no error    | a route failed to render                                                       |

## Reading the numbers

- Backend requests, API calls after load, discarded nodes and payload bytes are counts. They came out the same on a laptop and on both CI runners, so a change in one of them is a change in the code.
- The Lighthouse score, the paint timings and time to first byte depend on the machine and move between identical runs. Compare them only within one environment, and look for a change on several routes before trusting it.
- Layout shift on druxt-site flips between runs of the same code until the hydration problem in [#837](https://github.com/druxt/druxt.js/issues/837) is fixed. It carries a quarter of the Lighthouse score, so the druxt-site performance budget can breach with no code change. Read the counts on those routes.
- Warm equals cold on every route today. Nothing is cached between server renders.

## Each release

1. Run the audit on the release candidate.
2. Read the deltas against the previous release.
3. Refresh every baseline and commit them with the release:
   - `perf/baseline.local.json`: `mise exec node@22 -- yarn perf:audit --update-baseline`.
   - `perf/baseline.github.json` and `perf/baseline.gitlab.json`: run each CI job with its baseline update switched on (see below) and commit the file from its artifact.

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
`GITLAB_API_TOKEN` is set as a masked CI variable holding a
token with `api` scope, the same variable the other merge request comment scripts use. A run on GitHub comments on its pull request
using the workflow's own token. A run started by the label takes the pull request number from its ref. A run started with `Run workflow` looks for an open pull request on the branch. Either way a later run edits the
same comment instead of adding a new one. Commenting never fails the job.

Every GitHub run also writes the summary to its run page. GitHub gives a run on a pull request from a fork a read-only token, so the comment is refused there and the run page is where to read the result.
