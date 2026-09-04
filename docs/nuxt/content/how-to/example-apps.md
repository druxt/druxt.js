---
title: Explore the example apps
weight: 1
description: 'Reference apps sharing one Umami backend, from an unstyled pattern index through daisyUI and Tailwind themes to a BootstrapVue editorial console.'
---

The [`druxt.js` monorepo](https://github.com/druxt/druxt.js) includes a suite of
full reference apps under `examples/`, all built against the same Drupal
Umami demo content: a recipe magazine with articles, recipes, and a contact
form. Screenshots below are real captures of the running apps.

> **Before you start:** these are apps you run yourself against a local
> Drupal backend, not hosted demos. The backend they expect is the
> monorepo's Umami-provisioned Drupal at `docs/drupal` (see
> `examples/README.md` in the monorepo for the exact commands), not the
> empty quickstart site from the tutorial.

---

## druxt-site: the technical reference

![The druxt-site /examples index, listing ten technical pattern pages](/images/examples-druxt-site.png)

The plain, unstyled baseline the other three apps are compared against: a
wireframe system (one type scale, 8px spacing rhythm, no palette, no
component library) deliberately undressed so nothing distracts from the
underlying Druxt output. Its `/examples/*` pages are the actual point:
eleven focused demonstrations covering `DruxtDebug`, entity queries,
an entity explorer, an entity form, frontend menu editing, router modes, the
schema mixin, wrapper theming, views, a custom `DruxtCardGrid` module, and
reactive client-side filtering. If you want to see one specific Druxt concept in
isolation without a themed app around it, start here.

## Recipe Box (druxt-daisyui): swipe-to-save discovery

![Recipe Box: a mobile discovery deck showing a recipe card with category filter chips and a saved-count badge](/images/examples-recipe-box.png)

This is a mobile-first discovery deck showing one recipe at a time. Swipe,
use the Save/Skip buttons, or press ←/→ to build a saved collection that
persists in `localStorage` across reloads. All three input methods work
equally well. Built on the `druxt-site` all-in-one module, styled with DaisyUI on
Tailwind. The interesting part for anyone evaluating Druxt: the swipe
mechanics, animation, and persistence are all plain Vuex + CSS transitions.
Nothing about the interaction pattern itself is Druxt-specific, only the
data behind each card is.

## Meal Planner (druxt-tailwind): drag-and-drop, no Nuxt at all

![Meal Planner: a recipe library on the left and a seven-day drag-and-drop planning grid on the right, with live totals](/images/examples-meal-planner.png)

This is a two-pane planning board: filterable recipe library on the left, a
seven-day grid on the right, with native HTML5 drag-and-drop (plus a
click-to-place equivalent calling the identical store action, for touch and
assistive tech) and live-recomputed per-day/per-week totals and a
deduplicated shopping list. The one deliberately **Nuxt-free** app in the
suite: plain Vue 2 + Vite + vue-router, proving that Druxt's Vuex store
modules, `DruxtClient`/`DruxtRouter`, and Vue components work outside Nuxt
entirely (Nuxt's `fetch()` lifecycle hook is the one thing with no
plain-Vue equivalent, replicated by hand with a small compatible mixin).
If you've been assuming Druxt requires Nuxt, this app is the counterexample.

## Content Ops Console (druxt-bootstrapvue): authenticated inline editing

![Content Ops Console: a dark sidebar next to a dense editorial table with inline difficulty/prep-time editing and a "needs attention" filter, showing real content from the backend](/images/examples-content-ops-console.png)

A dense, sortable content table (recipes + articles) with single-cell
inline editing via `DruxtEntityForm`'s PATCH path, optimistic UI (a cell
updates immediately, the row shows "Saving" → "Saved" without waiting on
the round trip), a "needs attention" filter for content missing fields,
and a deliberately scripted failure case (editing one specific recipe
fails on purpose) to prove the error-banner-plus-Retry/Revert path
actually works, not just the happy path.

This is the one app in the suite that needs a logged-in user: every write
goes through the same OAuth2 Authorization Code + PKCE flow covered in [Add
a login flow](/tutorials/authentication). Its `nuxt.config.js` is already
wired with a committed Drupal Consumer (public, PKCE) dedicated to this
example, independent of the quickstart's own consumer.

## Run them yourself

Every app expects a running Drupal backend (`BASE_URL`, default
`http://127.0.0.1:8888`) with the demo Umami content. Provision it with
the monorepo's `docs/drupal` tooling (`examples/README.md` has the
commands), then from the monorepo root:

| App                 | Directory                     | Dev command       |
| ------------------- | ----------------------------- | ----------------- |
| druxt-site          | `examples/druxt-site`         | `yarn dev`        |
| Recipe Box          | `examples/druxt-daisyui`      | `yarn dev`        |
| Meal Planner        | `examples/druxt-tailwind`     | `yarn dev` (Vite) |
| Content Ops Console | `examples/druxt-bootstrapvue` | `yarn dev`        |

## Where to go next

- Log in before trying Content Ops Console yourself: [Add a login
  flow](/tutorials/authentication).
- See the underlying patterns without a themed app around them:
  `druxt-site`'s `/examples/*` pages, above.
- Understand the machine all four apps sit on top of:
  [Architecture](/explanation/architecture).
