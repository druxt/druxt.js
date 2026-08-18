# Meal Planner (druxt-tailwind)

Drag recipes onto a week; totals derive live.

A purpose-built tool on the same Umami demo content, styled with TailwindCSS
utility classes only. Two-pane layout: a filterable recipe library on the
left, a 7-day planning grid on the right. Drag a recipe onto a day (or click
to select, then click a day — the same touch/assistive-tech equivalent,
calling the same store action). Total time, busiest day, category mix, and
a deduplicated shopping list all recompute live from the plan on every
move.

Unlike `examples/druxt-site`, this app doesn't represent Drupal's "Site"
model — no menu, no breadcrumb, no generic content browsing, one page. It
fetches recipes directly via `druxt/getCollection` and renders plain HTML,
so `druxt` (the base package) is its **only** Druxt dependency —
`druxt-router`/`druxt-menu`/`druxt-breadcrumb`/`druxt-views`/`druxt-entity`/
`druxt-schema` were never actually needed here.

**Runs without Nuxt** — plain Vue 2.7 + Vite 4 + vue-router 3 + Vuex 3, with
each Nuxt module's wiring done by hand. It's the one example in the suite
that doesn't need server-rendering at all (a planning tool has no SEO
surface), which is exactly why it's the one built this way — see the app's
own "why no Nuxt" note in the UI. The project's internal workspace wiki has
the full design brief, including a "No-Nuxt architecture" table mapping
what Nuxt normally does automatically vs. what's wired explicitly in
`src/main.js`.

## What it demonstrates

- Druxt's Vuex store modules and `DruxtClient` running **outside Nuxt
  entirely** — proof that Nuxt's role is convenience wiring, not a hard
  dependency.
- Drag-and-drop plus a keyboard/click equivalent driving one Vuex module.
- Derived state recomputed on every store mutation (totals, category mix,
  shopping list) — not re-fetched, just recalculated from what's already in
  the client.
- A minimal real-world footprint: only the `druxt` package itself is a
  dependency, since this app never uses `DruxtEntity`/`DruxtMenu`/
  `DruxtView`/`DruxtRouter` — a tool that doesn't route or browse
  generically doesn't need to wire up the modules that do.

## Quick start

From the monorepo root:

```bash
yarn install
yarn build          # build all packages
yarn example:druxt-tailwind
```

Or from this directory:

```bash
yarn && yarn dev
```

Serves on `http://localhost:3000`.

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

## Testing

```bash
yarn test          # from this directory - Cypress, headless
yarn cypress:open  # interactive runner
```

Or `yarn example:druxt-tailwind:test` from the monorepo root, which starts
the dev server first.
