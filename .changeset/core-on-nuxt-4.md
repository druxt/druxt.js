---
'@druxt/core': major
---

feat(#980)!: add `@druxt/core`, the Druxt module for Nuxt 4, in place of the `druxt` package.

The store runs on Pinia, and `useDruxtClient()` gives a component the configured client. `useDruxtStore()` is auto-imported, and its `peekResource()` and `peekResources()` read what the store holds, with no request, during a render.

The store's `getResource()` throws a `TypeError` naming an empty type or id. 1.x returned an empty object. `druxt.auth.password` turns the password sign-in on or off. Unset, a build secret or a Consumer of its own turns it on. Off, the token route refuses the password grant, and stays only for a session the server holds, for its code grant and refresh. The route sends a secret only when one is set, so a site whose secret arrives at runtime, or whose Consumer is public, sets `password: true`. With `proxy.api` on, the tokens leave JavaScript: the token route keeps them in `httpOnly` cookies on the site's host, `Secure` on an https site, and the proxy sends the access token to Drupal as the `Authorization` header. The browser reads only `druxt.auth.session`, the token's expiry. The authorization code grant and the refresh go through the token route, `POST /api/_druxt/auth/token`, too, and `POST /api/_druxt/auth/logout` signs out. A sign-in through the client itself, `$druxt.auth.loginWithPassword()`, ends the session the browser had as it asks Drupal, as 0.x did, so one Drupal refuses leaves the browser signed out, never signed in as the user before. Server renders for one browser that need a refresh at once, such as tabs opening together after Drupal revoked the visitor's access token, share one refresh within the server process, as Simple OAuth accepts a refresh token once. `auth.exposeToken: true` keeps the tokens readable by the page's scripts, as 0.x did, for a module that calls Drupal outside the proxy: a weaker setting. A token too large for a browser's cookie, past 4096 bytes, doesn't set a cookie: the sign-in is refused with a 502 and `DRUXT_E01007`, and a refresh that answers one ends the session.

`druxt.siteUrl` names the site's public origin for links a page emits about itself. It defaults to an empty string, so `NUXT_PUBLIC_DRUXT_SITE_URL` can set it on a site that does not declare it in `nuxt.config.ts`.

The module splits `druxt` once. Secrets move to the private `runtimeConfig.druxt`, and the rest is public at `runtimeConfig.public.druxt`. Read settings with `useDruxtSettings()`, and on the server with `useDruxtServerSettings(event)`. A decoupled-settings fetcher hands settings from Drupal to `storeDrupalSettings()` or `setDrupalSettings()`, and the config wins over them. A fetcher module names the Consumer it reads for in an option of its own, such as `druxt.site.settingsConsumerId`. Core has none. `setDrupalSettings()` merges the public tier over the stored one, so a runtime fetcher keeps what the server stored at start, and `{ replace: true }` replaces it instead. Module settings are no longer client options.

A Druxt module registers its default settings with `addDruxtDefaults()` from `@druxt/core/kit`. The build holds them, and neither an environment variable nor the public runtime config changes them. They resolve after core's defaults and before the settings Drupal publishes and the site's config, so Drupal can change a module's default too.

Under pnpm, `nuxt dev` works without adding the module's CommonJS libraries to your own dependencies.

BREAKING CHANGE: install `@druxt/core` in place of `druxt`. The module runs on Nuxt 4 and Vue 3 only, the store is Pinia, and the options-API `DruxtModule` and the mixins are gone from core. The private runtime config keys `druxtAuth`, `druxtCache` and `druxtBuild` are now `druxt.auth`, `druxt.cache` and `druxt.build`, and the environment variable names are unchanged.

`getResource()` waits for a request already in flight for the same resource with another query, unless the store already answers, so a second reader of one entity, such as a standalone field beside its entity, is answered from the store. A request with the same query is shared, its failure included.

The store's `addResource()` and `addCollection()` take `partial`, so a module seeding a view's rows records the fields each holds, and a later read of another field fetches it. A resource with no self link is still stored. An included resource, at any depth, is stored with every field, so a sparse read of it comes from the store. The store doesn't keep Drupal's `links` on resources, relationships or collections, so a page's payload doesn't name backend URLs. What Drupal omitted is kept as its reason and the omitted types and ids.

The store's `peekMeta()` gives the `meta` of the document a resource came in, such as what Drupal omitted, with no request. A stored resource's includes skip the resources Drupal already denied, and omitted links are read against the client's JSON:API path.
