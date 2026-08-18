# Shared example test infrastructure

Cypress commands, fixtures, and selector helpers shared across every app
under `examples/` (`druxt-site`, `druxt-daisyui`, `druxt-tailwind`,
`druxt-bootstrapvue`). Not itself a runnable example — imported by the
others.

## Usage

From an example app's Cypress support file:

```js
// <app>/test/cypress/support/e2e.js
import '../../../../shared/cypress/commands';
import './commands'; // app-local commands, if any
```

Fixtures and selector helpers can be imported directly where needed:

```js
import umami from '../../../../shared/cypress/fixtures/umami.json';
import { byFetchKey, byTestId } from '../../../../shared/cypress/utils/selectors';
```

(Path depth assumes the app follows `druxt-site`'s convention of
`<app>/test/cypress/...` — four levels below `examples/`.)

## What's here

| Path                          | Purpose                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `cypress/commands.js`         | `cy.druxtEntityRenders()`, `cy.druxtMenuHasItems()`, `cy.druxtBreadcrumbTrailIs()` |
| `cypress/utils/selectors.js`  | `byFetchKey()`, `byTestId()` — selector builders, not app-specific markup          |
| `cypress/fixtures/umami.json` | Known Umami demo content (titles + stable paths) and known menu structure          |

## Why paths, not UUIDs

Drupal assigns a fresh UUID to every entity at creation time, so a node's
UUID is not stable across a reinstalled/reseeded backend. The Umami demo
content's **path aliases** (e.g. `/recipes/deep-mediterranean-quiche`) _are_
stable — they're generated deterministically from the same install data
every time (see `umami.json`'s `_comment` for the source). Specs should
`cy.visit()` a known path and let `DruxtRouter` resolve it, rather than
depending on a UUID fetched some other way.

## `menus.account` note

`umami.json`'s `menus.account` value (`['Log in']`) is confirmed against the
existing `druxt-site` homepage spec. Any other menu structure added to the
fixture should be verified against a running DDEV backend before a spec
depends on it — see the `_comment` field next to `menus` in the fixture.
