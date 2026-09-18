# Performance audit

Measures the example applications per route and compares each run with `perf/baseline.json`.

| Layer | Metrics | Source |
| --- | --- | --- |
| Backend | requests per server render, cold and warm, by endpoint | the `php -S` log written by `examples/drupal/.devtools/start` |
| Server render | time to first byte, HTML bytes, inline `__NUXT__` bytes, `data-fetch-key` count, status, error state | one fetch per route against `nuxt start` |
| Browser | Lighthouse performance, LCP, CLS, TBT, FCP, requests, bytes, API calls after load | Unlighthouse CI |

## Run it

The audit needs Node 18 or later; the examples build under Node 16.

    examples/drupal/.devtools/start
    scripts/perf-audit/serve-examples.sh start
    mise exec node@22 -- yarn perf:audit
    scripts/perf-audit/serve-examples.sh stop

Flags: `--example <name>` (repeatable), `--skip-lighthouse`, `--update-baseline`, `--out <dir>`.

Reports land in `.perf/<timestamp>/report.md` and `report.json`. Budgets are in `config.mjs`; a breach exits 1.

## Each release

1. Run the audit on the release candidate.
2. Read the deltas against the previous release.
3. `mise exec node@22 -- yarn perf:audit --update-baseline` and commit `perf/baseline.json` with the release.

In CI the manual gitlab `perf:audit` job and the GitHub `Performance audit` workflow (`workflow_dispatch`, with optional example and skip-Lighthouse inputs) do the same and keep `.perf/` as an artifact.
