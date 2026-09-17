# Content Ops Console (druxt-bootstrapvue)

A dense editorial table with authenticated inline write-back to Drupal's
JSON:API.

A themed Druxt reference site on a trimmed set of bespoke individual
modules (`druxt-auth`, `druxt`, `druxt-entity`, `druxt-schema`, with no
router, menu, views, or breadcrumb modules, since this app has no page
beyond the console itself), styled with [BootstrapVue](https://bootstrap-vue.org/) 2 on
Bootstrap 4. Unlike the other examples, this one **writes**: a sidebar nav
(Content / Recipes / Articles / Taxonomy) drives a sortable, filterable
table with single-cell inline editing, covering both recipes/articles and
taxonomy terms (recipe categories, tags). Edits are optimistic (the cell
updates immediately, the row shows "Saving" then "Saved" without waiting on
the round-trip) and PATCH to Drupal over a real OAuth2 Authorization Code +
PKCE login, not a mocked one. A filter flags content missing required fields
as "needs attention", computed from data already fetched.

The full design brief lives in the project's internal workspace wiki, not
in this repo. Not to be confused with `examples/node-client`'s
`druxt-inspect`. That's a literal terminal CLI; this is a full web app
despite the "console" name.

## What it demonstrates

- `DruxtEntityForm`'s `updateResource`/PATCH path: the write side, not just
  read/render, and the first place in this suite that exercises it.
- Real authentication (`druxt-auth` + `@nuxtjs/auth-next`, OAuth2
  Authorization Code + PKCE against the `simple_oauth` Consumer that
  `examples/drupal` provisions) gating what's editable.
- Optimistic UI: local state updates ahead of server confirmation, with a
  visible in-flight state.
- Failure handling as a first-class case: a network or validation failure
  shows the JSON:API `errors[0].detail` shape plus Retry/Revert actions,
  rather than crashing or failing silently.

## Quick start

From the monorepo root:

```bash
yarn install
yarn build          # build all packages
yarn example:druxt-bootstrapvue
```

Or from this directory:

```bash
yarn && yarn dev
```

Serves on `http://localhost:3004`. The port is **pinned**: the committed
OAuth consumer's redirect URI is `http://localhost:3004/callback`, so
changing it breaks login.

Sign in with **admin / druxt123** (the `examples/drupal` admin, set by its
provision) to unlock
editing. The same credentials are shown directly in the app's sidebar
whenever you're signed out, so there's nothing to look up. The table itself
renders read-only when signed out; attempting an edit while signed out is a
real (not simulated) way to see the failure path, since Drupal
rejects the unauthenticated write.

## Configuration

The backend URL defaults to `http://127.0.0.1:8888`, the port
`examples/drupal/.devtools/start` serves on. Override with the `BASE_URL`
environment variable if your backend runs elsewhere:

```bash
# .devtools/ backend (default, no override needed)
yarn dev

# Custom backend URL
BASE_URL=https://cms.example.com yarn dev
```

The OAuth Consumer is created by `examples/drupal`'s `druxt_examples`
module when the backend is provisioned. If login stops working, re-provision
with `make build` in `examples/drupal`.

## Testing

```bash
yarn test          # from this directory - Cypress, headless
yarn cypress:open  # interactive runner
```

Or `yarn example:druxt-bootstrapvue:test` from the monorepo root, which
starts the dev server first.
