# DruxtSite Example

The DruxtSite module provides an out-of-the-box decoupled Druxt site experience for Nuxt.js.

This example demonstrates a full DruxtSite integration with the Druxt demonstration backend, including consolidated example pages that were previously standalone projects.

## Quick start

From the monorepo root:

```bash
yarn install
yarn build          # build all packages
yarn example:druxt-site
```

Or from this directory:

```bash
yarn && yarn dev
```

## Example pages

| Page                           | Pattern                                                                                 | Backend required |
| ------------------------------ | --------------------------------------------------------------------------------------- | ---------------- |
| `/examples/debug`              | DruxtDebug component                                                                    | No               |
| `/examples/entity-queries`     | DruxtEntity query settings                                                              | Yes              |
| `/examples/entity-explorer`    | Interactive entity browser                                                              | Yes              |
| `/examples/entity-form`        | DruxtEntityForm                                                                         | Yes              |
| `/examples/menu-edit`          | DruxtMenu frontend editing                                                              | Yes              |
| `/examples/router-modes`       | DruxtRouter modes                                                                       | Yes              |
| `/examples/schema`             | DruxtSchemaMixin on custom data                                                         | Yes              |
| `/examples/wrappers`           | DruxtWrapper theming                                                                    | Yes              |
| `/examples/views`              | DruxtView default results slot vs. template injection                                   | Yes              |
| `/examples/custom-module`      | Custom module (`DruxtCardGrid`)                                                         | Yes              |
| `/examples/reactive-filtering` | Live ingredient-matching recipe search (computed re-rank + debounced free-text watcher) | Yes              |

## DruxtSite theme overrides

A handful of small wrapper components fix real gaps in the plain
`druxt-site` render — modeled on `sites/umami.demo.druxtjs.org`'s own
(much larger) theme, kept as minimal as each block actually needs:

- `components/druxt/site/Umami.vue` — Drupal's block-placement API gives
  regions with no visual order (see `DruxtSite.vue`'s own docblock). Without
  this override, `page_title` and a couple of other regions render in
  whatever order the JSON:API happens to return, not the order a themed
  page would use. This wrapper renders the same regions in a fixed,
  sensible order instead, and adds the one bit of app-level chrome this
  example needs: a persistent link to `/examples`.
- `components/druxt/entity/taxonomy_term/Default.vue` — the Umami demo
  content has no "default" view mode configured for `taxonomy_term`
  entities (recipe categories, tags), so `DruxtEntity` falls back to its
  "missing display settings" debug box wherever a term renders. Why that
  display config is missing needs more digging (not fixed here — possibly
  a genuine gap in the demo profile, since taxonomy terms aren't normally
  rendered as standalone pages). This wrapper is a minimal stand-in: it
  just renders the term's name.
- `components/druxt/block/SystemBrandingBlockUmami.vue` and
  `SearchFormBlockUmami.vue` — the Umami theme's real logo and a plain
  `GET /en/search/node` form (Drupal core search, already enabled on this
  backend). Both are genuinely functional, not placeholders.
- `components/druxt/block/SystemMessagesBlockUmami.vue`,
  `HelpBlockUmami.vue`, and `LocalTasksBlockUmami.vue` — these three
  render nothing on purpose. Drupal's session flash messages, route-level
  admin help text, and local-task tabs (`/node/X/edit`) don't have a
  clean decoupled-frontend equivalent, so a themed no-op is the honest
  answer, not a fake implementation of something this app can't actually
  do.

## Configuration

The backend URL defaults to `http://127.0.0.1:8888` — the port
`docs/drupal/.devtools/start` serves on. Override with the `BASE_URL`
environment variable if your backend runs elsewhere:

```bash
# .devtools/ backend (default, no override needed)
yarn dev

# Custom backend URL
BASE_URL=https://cms.example.com yarn dev
```
