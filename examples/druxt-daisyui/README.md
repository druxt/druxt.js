# Recipe Box (druxt-daisyui)

Swipe through recipes, keep the ones you like.

A themed Druxt reference site on the `druxt-site` all-in-one module, styled
with [DaisyUI](https://daisyui.com/) 4 on Tailwind 3. Instead of a
brochure-style listing page, recipes are presented one at a time as a
swipeable discovery deck — drag, tap Save/Skip, or use the arrow keys, all
driving the same store action. Saves persist to `localStorage` and survive a
reload, entirely client-side.

The full design brief (mood board, palette, typography, component specs)
lives in the project's internal workspace wiki, not in this repo.

## What it demonstrates

- A themed all-in-one `druxt-site` integration (the "fastest path" — compare
  against `druxt-tailwind`/`druxt-bootstrapvue`'s bespoke-module approach).
- `<transition>`/`<transition-group>` animation driving a real interaction,
  not just a page-load effect.
- A small Vuex module + persistence plugin writing to `localStorage` — state
  that survives a refresh with zero backend involvement.
- One store action reachable three ways (drag, buttons, keyboard) — a
  concrete example of building an accessible interaction on top of a single
  source of truth.

## Quick start

From the monorepo root:

```bash
yarn install
yarn build          # build all packages
yarn example:druxt-daisyui
```

Or from this directory:

```bash
yarn && yarn dev
```

Serves on `http://localhost:3001`.

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

Or `yarn example:druxt-daisyui:test` from the monorepo root, which starts
the dev server first.
