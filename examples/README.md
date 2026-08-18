# DruxtJS Examples

Six directories covering the main ways to build with Druxt: the all-in-one
site module, three themed showcases built on bespoke modules, a plain-Node
CLI over the framework-agnostic clients, and the test infrastructure they
share.

| Directory            | What it is                                                                                                                                                                                                                                       | Stack                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `druxt-site`         | The canonical reference: a full site on the `druxt-site` all-in-one module, with `pages/examples/` demo pages consolidating every framework pattern (debug, wrappers, schema, router modes, entity queries/forms, menu editing, custom modules). | Nuxt 2 + druxt-site   |
| `druxt-daisyui`      | Recipe Box: swipe through recipes one at a time, save the ones you like to a persistent collection, open any recipe in an in-page detail panel. DaisyUI 4 / Tailwind 3.                                                                          | Nuxt 2 + DaisyUI      |
| `druxt-tailwind`     | Meal Planner: drag recipes onto a 7-day grid; totals and a shopping list derive live. TailwindCSS utilities only, and **no Nuxt**: plain Vue 2 + Vite 4, with each Nuxt module's wiring done by hand.                                            | Vue 2 + Vite 4        |
| `druxt-bootstrapvue` | Content Ops Console: a dense, sortable/filterable content + taxonomy table with authenticated inline write-back to Drupal's JSON:API over real OAuth2. BootstrapVue 2.                                                                           | Nuxt 2 + BootstrapVue |
| `node-client`        | `druxt-inspect`: a CLI (`types`, `schema`, `stubs`, `sample`, `views`) proving `DruxtClient`/`DruxtSchema` run anywhere Node does, with no Vue/Nuxt. Backend-free Jest suite via recorded fixtures.                                              | Node                  |
| `shared`             | Cypress commands and Umami content fixtures used by the app examples above, imported not copied.                                                                                                                                                 | Cypress               |

Only `druxt-site` represents Drupal's "Site" model (menu, breadcrumb,
generic content browsing via the wildcard router). That's deliberate, and
it's the one app in the suite meant to be read that way. Recipe Box, Meal
Planner, and Content Ops Console are each a genuinely different,
purpose-built application drawn from the same Umami demo content, not three
reskins of one brochure site: none of them ship a site-wide menu or
breadcrumb, and none resolve arbitrary Drupal paths. Design briefs (mood
board, palette, typography, component specs) for the three themed apps live
in the project's internal workspace wiki, not in this repo.

## Backend

Every example targets the Umami demo Drupal backend at `docs/drupal`
(druxtjs.org's own docs site backend):

```bash
cd docs/drupal
.devtools/assemble && .devtools/provision && .devtools/start
# prints the URL it's serving on, default http://127.0.0.1:8888
```

No Docker required: just PHP 8.3, Composer, and SQLite. See
`docs/drupal/.devtools/README.md` for details.

## Quick start

```bash
# From the monorepo root:
yarn install
yarn build        # once, or `yarn dev` to watch-rebuild packages/*/dist

# Then any example (BASE_URL defaults to http://127.0.0.1:8888):
yarn example:druxt-site         # :3000, Nuxt + druxt-site
yarn example:druxt-daisyui      # :3000, Nuxt + DaisyUI
yarn example:druxt-bootstrapvue # :3000, Nuxt + BootstrapVue
yarn example:druxt-tailwind     # :3000, Vite (no Nuxt)

# The CLI (no dev server):
cd examples/node-client && node bin/druxt-inspect.js --help
```

## Tests

Each app example ships Cypress specs (runnable against a live backend):

```bash
yarn example:druxt-site:test
yarn example:druxt-daisyui:test
yarn example:druxt-tailwind:test
yarn example:druxt-bootstrapvue:test
```

`node-client` runs backend-free:

```bash
yarn test:node-client
```

CI runs all of the above (`.github/workflows/ci.yml`: `test-e2e` covers
`druxt-site` + Storybook + docs; `test-examples` runs the three themed apps
as a matrix; `test-node-client` runs the CLI suite).

## Docs

- `druxt-site`'s example pages map to framework features; see the app's
  README for the page table.
- Guides for the `custom-module` and `node-client` patterns are on the docs
  site under `/guides`.
