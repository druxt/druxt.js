<img src="https://raw.githubusercontent.com/druxt/druxt.js/HEAD/packages/core/banner.svg" alt="Druxt: the core module, client, store and module contract">

# @druxt/core

[![npm](https://badgen.net/npm/v/@druxt/core)](https://www.npmjs.com/package/@druxt/core)
[![dev](https://badgen.net/npm/v/@druxt/core/dev)](https://www.npmjs.com/package/@druxt/core/v/dev)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> The Druxt module for Nuxt 4: the configured client, the store and the module contract.

`@druxt/core` is the Nuxt module every other Druxt module builds on. It
provides the three pieces the whole framework shares:

- **[DruxtClient](#druxtclient)**: the `@druxt/client` JSON:API client,
  configured from `druxt` and given to components by `useDruxtClient()`.
- **[DruxtStore](#druxtstore)**: the Pinia store caching resources and
  collections for all modules, from `useDruxtStore()`.
- **[DruxtModule](#druxtmodule)**: `useDruxtModule()`, the contract behind the
  theme-component suggestion system.

## Installation

1. Install the package:

   ```sh
   npm i @druxt/core
   ```

2. Add the module and your backend URL to `nuxt.config.ts`:

   ```ts
   export default defineNuxtConfig({
     modules: ['@druxt/core'],
     druxt: {
       baseUrl: 'https://api.umami.demo.druxtjs.org',
     },
   });
   ```

   \* _Replace `https://api.umami.demo.druxtjs.org` with your own
   Drupal backend._

3. On the Drupal side, install and enable the
   [Druxt module](https://www.drupal.org/project/druxt) and grant the
   **access druxt resources** permission to the relevant roles. Missing this
   is the most common cause of site-wide JSON:API failures. See
   [Troubleshooting](https://druxtjs.org/how-to/troubleshooting)
   if requests are failing after install.

### Development releases

Every change merged to a release line is published under the `dev` tag:

```sh
npm i @druxt/core@dev
```

These are unreleased builds. See [development releases](https://druxtjs.org/how-to/use-development-releases) before using one.

## Requirements

Nuxt 4.4.4 or later in the 4.x line, and Vue 3.5. Nuxt 4.4 is the last minor on vite 7. Nuxt 4.5 and later need vite 8, so an integration that caps vite at 7 holds a site on Nuxt 4.4.

## Compatibility

|               | Supported                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nuxt          | 4.4.4 or later in the 4.x line. CI tests 4.4.4 and the workspace's own Nuxt.                                                                                                                                          |
| Vue           | 3.5                                                                                                                                                                                                                   |
| Vite          | 7 on Nuxt 4.4, 8 on Nuxt 4.5 and later, as Nuxt requires.                                                                                                                                                             |
| Node          | What Nuxt requires: 22.12 or 24.11 and later on Nuxt 4.4. Tested on 24.                                                                                                                                               |
| Drupal core   | 10 or 11. `drupal/druxt` 1.2.2 declares `^10 \|\| ^11 \|\| ^12` and ended 8 and 9 support. 12 is declared but waits on Decoupled Router and JSON:API Menu Items. Tested against 10 and 11.                            |
| Drupal module | `drupal/druxt` ^1.2.2, which brings `decoupled_router`, `jsonapi_menu_items` and `jsonapi_views`. Earlier 1.2.x releases are incompatible with Decoupled Router 2.0.7 ([#3618675](https://www.drupal.org/i/3618675)). |

What these bounds promise over time is stated in the
[support and versioning policy](https://druxtjs.org/explanation/support-and-versioning).

Translated routes also need a `decoupled_router` patch; see the
[multilingual guide](https://druxtjs.org/how-to/multilingual).

## Settings

| Option        | Type              | Default      | Description                                                                          |
| ------------- | ----------------- | ------------ | ------------------------------------------------------------------------------------ |
| `baseUrl`     | `string`          |              | The Drupal backend URL. **Required.**                                                |
| `endpoint`    | `string`          | `'/jsonapi'` | The JSON:API endpoint path.                                                          |
| `proxy.api`   | `boolean`         | `false`      | Proxy API requests via Nuxt ([guide](https://druxtjs.org/how-to/proxy)).             |
| `proxy.files` | `boolean\|string` | `false`      | Proxy Drupal files. A string sets the site.                                          |
| `cache`       | `boolean\|object` | `{}`         | The server cache, see below. `false` turns it off.                                   |
| `siteUrl`     | `string`          | `''`         | The site's public origin, for its canonical link. Also `NUXT_PUBLIC_DRUXT_SITE_URL`. |
| `classes`     | `boolean\|object` | `true`       | Which of Druxt's classes the default output has, see below.                          |
| `anchors`     | `boolean\|'dev'`  | `'dev'`      | Whether the default output has its anchors, see below. Read at build.                |

See the [Nuxt module API](https://druxtjs.org/api/packages/core/module) for the full
options list.

A page in a build without the Druxt modules reaches the client through `useNuxtApp().$druxt`. Auto-imports such as `useDruxtClient()` exist only when the module is registered.

## Configuration

The `druxt` block in `nuxt.config.ts` stays one flat object. The module splits it once, when the app builds, into three objects, each with one owner:

| Object           | Holds                                                                                  | Where it lives                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Client options   | How to reach Drupal: `baseUrl`, `endpoint`, `proxy`, `cache` and the public `auth`     | Built for each side from the public config. The browser uses the proxy, the server does not. |
| Settings         | What modules read: `siteUrl`, `develMessages` and one key per module, such as `router` | `runtimeConfig.public.druxt`, read resolved through `useDruxtSettings()`                     |
| Private settings | `auth.clientSecret`, `cache.secret` and `build.auth.*`                                 | `runtimeConfig.druxt`, on the server only                                                    |

No secret reaches the public config, the client bundle or the payload. Read the settings with `useDruxtSettings()`, never `useRuntimeConfig().public.druxt`. They leave out the client options and the credentials. The client's options are on `useNuxtApp().$druxt.options`:

```ts
const settings = useDruxtSettings();
if (settings.develMessages === 'inline') {
  // ...
}
```

`build.auth.clientSecret`, when written in `nuxt.config`, stays in the build-time options for the build client. Other modules can read it at build time, so prefer the `NUXT_DRUXT_BUILD_AUTH_CLIENT_SECRET` environment variable.

A server route reads them with `useDruxtServerSettings(event)`, which adds the settings Drupal marks server only. A route that needs a secret reads the private `runtimeConfig.druxt`.

### Classes

`druxt.classes` decides which of Druxt's classes the default output has: `true` for every class, the default, `false` for none, or the parts and modifiers to keep, such as `{ items: false, modifiers: ['field'] }`. A plugin rewrites them with `defineDruxtClasses((classes, ctx) => classes)`, which runs on the server and in the browser alike, so it must return the same list for the same input. The entity module's README lists every class and the policy's parts. The naming rules and `resolveDruxtClasses()` are in `@druxt/core/classes`, which doesn't import a framework.

### Anchors

The default output names the entities and fields it renders with data attributes, for an inline editor, a diff view or the site's tests to find again. `@druxt/core/anchors` holds the contract, which doesn't import a framework:

| Attribute             | Holds                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `data-druxt-entity`   | The entity's id, exactly as JSON:API returned it                                            |
| `data-druxt-type`     | The resource type, such as `node--recipe`                                                   |
| `data-druxt-langcode` | The entity's language, on an entity's root and a standalone field's, when Drupal returns it |
| `data-druxt-field`    | The field's public name, on each item                                                       |
| `data-druxt-delta`    | The item's index, on each item of a multi-value field                                       |

`entityAnchors()` and `fieldAnchors()` write them, and `findAnchor()` finds an element again, or gives `null`, never an error, where there is nothing to search:

```ts
import { findAnchor } from '@druxt/core/anchors';

const item = findAnchor(document, { entity: uuid, field: 'field_tags', delta: 1 });
```

`druxt.anchors` is `'dev'` by default: on in development, off in production. `true` turns them on everywhere, and `false` off everywhere. A module that needs them, such as an inline editor, turns them on in production with `requireDruxtAnchors()` from `@druxt/core/kit`:

```ts
import { requireDruxtAnchors } from '@druxt/core/kit';

const anchors = requireDruxtAnchors(nuxt, {
  module: '@druxt-contrib/fae',
  reason: 'it finds the fields an editor edits',
});
nuxt.hook('modules:done', () => {
  if (!anchors.enabled)
    logger.warn('Front-end editing is off: this site turned Druxt anchors off.');
});
```

A site that sets `anchors: false` keeps them off: explicit config wins over a module. The build then warns once for each requiring module, naming it and its reason. The state settles once every module is in, so the order modules run in does not matter. A module reads it in a `modules:done` hook, as above. The `druxt:anchors` hook receives it too, as `{ enabled, requiredBy, disabledBy }`. In the app, `useDruxtAnchors()` gives the same state, so a module can tell its users:

```vue
<script setup lang="ts">
const { enabled } = useDruxtAnchors();
</script>

<template>
  <p v-if="!enabled">Front-end editing is off because this site disabled Druxt anchors.</p>
</template>
```

The Settings section of the development tools shows the state and the modules that required it. Drupal's settings cannot change it.

### Environment variables

Set secrets at runtime, never in `nuxt.config.ts`, where they are part of the build.

| Variable                                                                                          | Sets                                      |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `NUXT_PUBLIC_DRUXT_SITE_URL`                                                                      | `siteUrl`                                 |
| `NUXT_DRUXT_AUTH_CLIENT_SECRET`                                                                   | The confidential Consumer's secret        |
| `NUXT_DRUXT_CACHE_SECRET`                                                                         | The `POST /api/_druxt/cache/clear` secret |
| `NUXT_DRUXT_PROXY_TRUST_FORWARDED`                                                                | `proxy.trustForwarded`                    |
| `NUXT_DRUXT_BUILD_AUTH_CLIENT_ID`                                                                 | The server's own Consumer                 |
| `NUXT_DRUXT_BUILD_AUTH_CLIENT_SECRET`                                                             | The server's own Consumer's secret        |
| `NUXT_DRUXT_BUILD_AUTH_USERNAME`, `NUXT_DRUXT_BUILD_AUTH_PASSWORD`, `NUXT_DRUXT_BUILD_AUTH_SCOPE` | The server's password grant and scope     |

`DRUXT_AUTH_CLIENT_SECRET` and the `DRUXT_BUILD_*` variables still work when they are present at runtime.

### Proxy

With `proxy.api`, the browser reaches Drupal through the site's own origin: the JSON:API, `/oauth/token`, `/oauth/userinfo` and the router's `/router/translate-path`. `proxy.files` adds the files directory. One server handler serves them all and reads the base URL for each request, so `NUXT_PUBLIC_DRUXT_BASE_URL` set after the build moves the browser's requests and the server's together.

- The method and the headers pass through, and the body streams through. `Host`, `Accept` and `Accept-Encoding` are not forwarded, so Drupal sees its own host. Nor is `Connection`, a header it names, or another header for one hop only, such as `TE` and `Proxy-Authorization`.
- `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto` are set from the site's own view of the request. Any forwarding header the browser sent is dropped, along with `Forwarded`, `X-Forwarded-Port`, `X-Forwarded-Server` and `X-Real-IP`.
- A path under `/api/_druxt` never reaches Drupal. One no Druxt route takes, such as a `GET` to the `POST` token route, answers 404, where a proxy at `/api/**` would otherwise take it.
- A redirect passes through to the browser. A `Location` on Drupal's base URL becomes the same path on the site, always a path that starts with one `/`. A `Location` on another host is left as it is, as any reverse proxy leaves it, so the browser follows Drupal's redirect off the site.
- A cookie Drupal sets for its own host is set for the site's host.
- Of the browser's cookies, Drupal gets only its own session cookie, `SESS` or `SSESS` and a hash, or the one `cache.sessionCookie` matches. Druxt's `druxt.auth.*` cookies, another module's, such as nuxt-auth-utils' `nuxt-session`, and the site's own never reach Drupal, and a request with none of Drupal's sends no `Cookie` header. When the site's server holds the sign-in, the proxy sends the access token from its cookie as the `Authorization` header. A request that sends its own header keeps it, and the proxy doesn't add credentials to one that sends `X-Druxt-Auth: none`. A token cookie that doesn't decode, such as a bare `%`, counts as none, and the request goes to Drupal anonymously.
- The response's encoding and length headers are recomputed, and the others come back as Drupal sent them.

Behind a front proxy, such as a hosting platform's nginx, Drupal sees that proxy as every visitor, which its flood control counts as one. Set `proxy.trustForwarded`, or `NUXT_DRUXT_PROXY_TRUST_FORWARDED=true` at runtime, to pass the front proxy's headers on: the visitor's address is added to its `X-Forwarded-For` chain, and its `X-Forwarded-Host`, `X-Forwarded-Proto` and the other forwarding headers pass through. It is safe only when a front proxy the site trusts sets those headers on every request, since otherwise a browser can forge them. It is server only, in the private runtime config.

Drupal gives a file's URL as a path on its own origin, such as `/sites/default/files/logo.png`. The default output resolves it with `resolveFileUrl()`, from `@druxt/core/files`, which doesn't import a framework:

- With `proxy.files` on, a path in the proxied files directory stays on the site.
- With it off, or for a path outside that directory, the path is made absolute on `druxt.filesUrl`, the origin Drupal's files are served from, such as a CDN's, or else on `druxt.baseUrl`. `NUXT_PUBLIC_DRUXT_FILES_URL` sets `filesUrl` at runtime.

In development, a field notes a rewritten URL in the Druxt DevTools tab. A wrapper resolves a file URL the same way with `useDruxtFileUrl()`, which is auto-imported. `resolveFileUrlsInHtml(html, resolve)` resolves each `src` and `href` under `/sites/<site>/files/` or `/system/files/` inside markup, such as an editor's inline image, and leaves the rest byte for byte.

Druxt's own server routes sit under `/api/_druxt`, such as `/api/_druxt/cache/clear` and `/api/_druxt/auth/token`, in Nitro's `/api` namespace. Many Drupal sites serve JSON:API at `/api`. Set `endpoint: '/api'` with `proxy.api` on, and the proxy takes `/api/**` while Druxt's routes and the site's own `server/api` routes answer first, so Drupal never sees them. A route answers only its own methods, so a request to a route of the site's, or of another module, with a method that route doesn't take goes through the proxy to Drupal, such as a `GET` to a `POST`-only `server/api/login.post.ts`. Only Druxt's own paths answer 404 for one. A JSON:API endpoint at or under `/api/_druxt`, with or without a language prefix, fails the build with `DRUXT_E01006`. Modules read the path from `DRUXT_API_BASE`, in `@druxt/core/routes` and `@druxt/core/kit`.

The JSON:API is proxied under each language's URL prefix as Drupal is configured, such as `/english/jsonapi` for `en`. The build reads the prefixes from Drupal. The default language's comes from the unprefixed index and each other language's from a probe at its langcode. When the decoupled_settings module publishes `language.negotiation` to visitors, the build reads every prefix from it, which is the one way to learn a prefix that is neither. A default language with no prefix is served unprefixed. A prefix the build cannot read is taken to be the langcode, with a warning. When Drupal refuses a production build's read of the languages, such as with the wrong build credentials, the build stops with `DRUXT_E01008`, as the site would otherwise route and proxy only its default language. When Drupal doesn't answer, as in a build that can't reach it, the build warns once and goes on with none. So does any failure in development, so the site starts while Drupal is away. The proxy then serves only the unprefixed endpoint, and a request under a language prefix misses it until a build reads them. The prefixes are read at build, so rebuild after changing them in Drupal. The client gets the same map, so a module's language reaches Drupal under the prefix it is served at.

In the app, `useDruxtLanguages()`, which is auto-imported, gives the same languages with their prefixes, and `defaultLangcode`, the language served with no prefix. It's `undefined` when every language has a prefix.

```ts
const { languages, defaultLangcode } = useDruxtLanguages();
```

### Settings from Drupal

A decoupled-settings module can publish settings from Drupal for a frontend's Consumer. Core does not fetch them. A fetcher module hands them to core in two tiers:

- **Public**: settings for the browser. `useDruxtSettings()` reads them from Nuxt state, so they reach the payload.
- **Server**: settings Drupal marks server only. They stay in Nitro's `druxt` storage and on the request, and never reach the browser.

`useDruxtSettings()` resolves the defaults, then the public tier, then the config, so `nuxt.config.ts` and the environment always win over Drupal. A config key left `undefined` or empty does not erase a value from Drupal. Without a fetcher, both tiers are empty and nothing changes.

A fetcher stores both tiers at server start, and while `nuxt generate` builds static pages, from a Nitro plugin:

```ts
// server/plugins/drupal-settings.ts
import { useDruxtServerClient } from '@druxt/core/server';
// The fetcher's own reader, which splits what Drupal returns into the two tiers.
import { readDrupalSettings } from './read-drupal-settings';

export default defineNitroPlugin(async () => {
  const client = await useDruxtServerClient();
  const { publicSettings, serverSettings } = await readDrupalSettings(client);
  await storeDrupalSettings('default', { public: publicSettings, server: serverSettings });
});
```

A call with one tier keeps the other. Calls for one connection write one after another, so two that overlap, such as one per tier, keep both. That holds within one server process: instances that share a storage driver each write on their own, so store both tiers in one call there.

To set them for one request during a server render, it calls `setDrupalSettings()` from a server-only plugin. The public tier is merged over the stored one, so a key stored at server start stays unless the request's tier sets it. Objects merge key by key, and arrays are replaced. The server tier goes on the request, in place of the stored one:

```ts
// plugins/drupal-settings.server.ts
export default defineNuxtPlugin(async () => {
  // Fresh values for this request, over what the Nitro plugin above stored.
  const { publicSettings, serverSettings } = await readDrupalSettings(useDruxtClient());
  setDrupalSettings('default', { public: publicSettings, server: serverSettings });
});
```

Pass `{ replace: true }` as the third argument to replace the stored public tier instead. Pass a server tier only from a server-only plugin or `storeDrupalSettings()`. A universal plugin's source is bundled for the browser, server tier and all, even though the browser drops the value.

Every settings function takes a connection name, `default` unless named. Other connections, in `druxt.connections`, are reserved for a later release: the module warns about any other name and uses the flat keys.

### Writing a settings fetcher

Core has no option for the Consumer whose decoupled settings are read, since not every site uses them. A module that integrates Drupal's decoupled settings registers its own option with `addDruxtDefaults()` from `@druxt/core/kit`, such as `druxt.site.settingsConsumerId`. When the site leaves it unset, the module falls back to the connection's Consumer, which the client exposes as `consumer.id`. The module writes what it reads with `storeDrupalSettings()`, as above.

## Server cache

In production, the server keeps Drupal's responses between requests for as
long as Drupal's `Cache-Control` header allows: the JSON:API index, and with
`cache.content` every other response. Drupal sets that header from its page
cache maximum age (Administration > Configuration > Development > Performance),
so at the default of 0 nothing is kept.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  druxt: {
    cache: { content: true, secret: process.env.DRUXT_CACHE_SECRET },
  },
});
```

| Option                | Type      | Default             | Description                                                                                                             |
| --------------------- | --------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `cache.content`       | `boolean` | `false`             | Also keep entities, collections, views and route lookups.                                                               |
| `cache.maxSize`       | `number`  | `52428800` (50 MB)  | Bytes of responses kept per cache area, across its consumers. The least recently used go.                               |
| `cache.ttl`           | `number`  |                     | Seconds a response may be kept at most. `0` keeps nothing.                                                              |
| `cache.secret`        | `string`  |                     | Turns on `POST /api/_druxt/cache/clear`.                                                                                |
| `cache.sessionCookie` | `string`  | `'S?SESS[0-9a-f]+'` | A pattern for the session cookie name, for a proxy that renames it. The proxy sends Drupal only the cookies it matches. |

- A request with an `Authorization` header, a Drupal session cookie or the
  site's own `druxt.auth.*` token cookie skips the cache, so a signed-in render
  reads Drupal, and `nuxt dev` runs without it.
- Only successful responses are kept, each as text, and every reader gets a
  fresh copy. A read with `bypassCache` fetches afresh, stores the result, and
  an older request that resolves after it never replaces it.
- A full cache area takes about three times `cache.maxSize` in server memory,
  and a response larger than the limit is not kept.
- A write Drupal accepts through the proxy, an editor's save, drops the entries
  for that resource, its type's collections and the route lookups on this
  process, so the next anonymous render reads the saved entity. It drops every
  JSON:API Views result too, under every language prefix, as a listing doesn't
  name the entities it shows: any accepted `POST`, `PATCH` or `DELETE` to a
  JSON:API resource drops every cached view. A write Drupal refuses drops
  nothing. Another process's cache waits for Drupal's clear.
- The modules' holds beside the cache, such as the schema, the date formats and
  the languages, are config: small, unbounded by `maxSize` and `ttl`, and
  dropped by the same clear.
- A static build, as `nuxt generate` makes it, has no server, so none of this
  applies to it. The prerender manifest route is never cached.
- Clear it with `useDruxtStore().clearCache()`, or from Drupal with
  `POST /api/_druxt/cache/clear` and the secret in an `X-Druxt-Secret` header, which
  the module bundles. Each Nuxt process has its own cache to clear.

The [caching guide](https://druxtjs.org/how-to/caching) covers the cache in
more depth.

### Clearing from Drupal with Purge

With `cache.content` on, an edit can take up to the page cache maximum age, or
`cache.ttl` if that is shorter, to reach anonymous visitors on another process,
unless Drupal clears the cache. The
[Purge](https://www.drupal.org/project/purge) module can send that request on
every save. Enable `purge`, `purge_purger_http`, `purge_queuer_coretags` and
a processor such as `purge_processor_lateruntime`, then add the bundled HTTP
purger:

```sh
drush p:purger-add httpbundled
```

Give it the method `POST`, the Nuxt host and port, the path
`/api/_druxt/cache/clear`, a header `X-Druxt-Secret` with the secret, and the
invalidation type `tag`. One save then costs one request, whatever it
invalidates, and a request refused for a wrong secret is sent again with the
next batch. Keep the secret out of exported configuration: set it from
`settings.php` as a `$config` override.

A purger set up for a 1.x site sends `/_druxt/cache/clear`. Change its path
to `/api/_druxt/cache/clear` when the site moves to 2.x, or the clear
answers 404.

## DruxtClient

The client is the communication layer between your application and Drupal's
JSON:API: resources, collections, indexing and authentication all flow
through it.

In a component, `useDruxtClient()` gives the client the module configured:

```ts
const client = useDruxtClient();
const collection = await client.getCollection('node--article');
```

Outside Nuxt, construct one from `@druxt/client`:

```ts
import { DruxtClient } from '@druxt/client';

const client = new DruxtClient('https://api.umami.demo.druxtjs.org');
const collection = await client.getCollection('node--article');
```

- [Use the Druxt client directly](https://druxtjs.org/how-to/use-the-druxt-client): practical
  guide, including non-Nuxt usage.
- [DruxtClient API](https://druxtjs.org/api/packages/client/client): full method reference.

## DruxtStore

The Pinia store that all Druxt modules share: request deduplication, the
resource/collection cache, and include handling. `useDruxtStore()` is
auto-imported.

```ts
const store = useDruxtStore();
const resource = await store.getResource({
  type: 'node--article',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
});
```

A module that has resources from a request of its own seeds the store with `addResource({ resource, partial })` or `addCollection({ collection, type, hash, partial })`. With `partial: true`, such as for a view's rows, a resource holds only the fields it came with, its own attribute and relationship keys, so a later read of another field fetches it. A resource with no self link is stored by its type and id. An included resource, at any depth, holds every field, so a later read of it, sparse or not, comes from the store. The store doesn't keep Drupal's `links`, on a resource, its relationships or a collection, so the page payload doesn't name a backend URL. It records partial or full when it adds a resource, so a hydrated page tells them apart too.

`clearCache()` empties the client's caches and every Druxt store. It also forgets which resources Drupal denied, so an include Drupal grants later is read again. The edit store's drafts are unsaved edits, so they stay. `clearCache({ drafts: true })` closes them too, and a sign-in and a sign-out call it that way, so one user's unsaved edits never reach the next.

- [The DruxtStore concept page](https://druxtjs.org/explanation/druxt-store): how it works
  and why it exists.
- [DruxtStore API](https://druxtjs.org/api/packages/core/runtime/store): its state
  and actions.
- [Deprecations](https://druxtjs.org/modules/druxt/deprecations): retired signatures.

## DruxtModule

A Druxt module turns a contract (wrapper candidates, data, props and slots)
into themeable rendering, through `useDruxtModule(props, contract)`. Building
one is covered by the
[custom module tutorial](https://druxtjs.org/tutorials/first-custom-module), and the mechanism
by [Component resolution](https://druxtjs.org/explanation/component-resolution).

A module's name is what its wrapper candidates are built from. In
`defineComponent()`, set `name` and return the render function from `setup()`:

```ts
export default defineComponent({
  name: 'DruxtRecipes',
  props: { ...druxtModuleProps, limit: Number },
  emits: druxtModuleEmits,
  setup(props) {
    const recipes = ref([]);
    return useDruxtModule(props, {
      componentOptions: () => [['default']],
      async fetchData(ctx) {
        const query = { 'page[limit]': String(props.limit || 3) };
        recipes.value = (
          await ctx.client.getCollection('node--recipe', query, ctx.lang.value)
        ).data;
      },
      propsData: () => ({ recipes: recipes.value }),
      state: { recipes },
      watch: () => [props.limit],
    });
  },
});
```

In `<script setup>`, the name comes from the file name, so set
`defineOptions({ name: 'DruxtRecipes' })` unless the file name is the full
module name. Nuxt names `components/druxt/Recipes.vue` `DruxtRecipes`, but the
file gives `Recipes`, and development warns about the difference. Render the
render function as a component:

```vue
<script setup lang="ts">
const props = defineProps(druxtModuleProps);
defineEmits(druxtModuleEmits);
const Module = useDruxtModule(props, { componentOptions: () => [['default']] });
</script>

<template>
  <Module />
</template>
```

A `<script setup>` module passes only `class`, `style` and listeners through to
its wrapper. A `defineComponent()` module passes its other attributes too, such
as `id` and `data-*`.

A wrapper, the component a module resolves and hands its data, is an ordinary
component, and `<script setup>` suits it.

A wrapper with no root element of its own, as Druxt's bundled block wrappers
are, declares `druxtRootless: true`. The module then renders its element around
the wrapper, and puts its classes and anchors, and a class the site sets, on
that one element. A contract hook reads the wrapper the module resolved from
`ctx.wrapper`.

A module's `state` holds references into the stores, such as a menu's store
key, never values that depend on the page's route. Under shared prerender data
another page reads the same entry, which a server's read again on a miss
leaves as it was.

A module with nothing to render says so through its contract's `empty()`
hook, from its data, such as a menu with no links. While the hook answers
`true`, the module renders no wrapper and no element, even for a class the site
set on it. A default slot the site passes still renders, with the module's
props, so the slot decides what an empty state shows.

The page renders one `h1`. A component that renders the page's title calls
`useDruxtPageTitle()` in `setup()` and renders the `h1` only while
`claim(owner)` answers `true`. The first claim on a page wins, so the page
title block and the route's full-mode `DruxtEntity` never both render one. When
the route names an entity, only that entity claims it. On a route with none,
the first full `DruxtEntity` does, unless its `page-title` is `false`. A
claimant claims for its own page's route, and lets the claim go when it
unmounts or is deactivated, so a functional component can't be one.

Druxt's components that render on nearly every page, `Druxt`,
`DruxtWrapper`, `DruxtRouter`, `DruxtEntity` and `DruxtField`, register
globally and sync. The rest, such as `DruxtDebug`, `DruxtEntityForm` and
`DruxtAuthLogin`, register globally and lazily, as a site's own `Druxt*`
components do, so each loads with the page that uses it, and still resolves by
name. A module
renders its default output in place, as `DruxtWrapper` rendered it, when the
site gives it neither a wrapper nor attributes and it has no root attributes of
its own. The markup is the same either way.

The hooks run outside the Nuxt context once they await, so a composable such as
`useDruxtClient()` throws there. Use `ctx.client`, `ctx.store` and `ctx.lang`,
or read anything else in `setup()` first.

Every instance with the same inputs shares one request and one payload entry,
and each renders all of it. A hook sets its data on the refs in `state`, and an
instance that did not fetch gets them restored, then `restore()` called.

Core runs `fetchData` whether or not the parent gives a model through
`v-model`. Skipping the fetch when the parent gives one is the module's
choice. Keep what the module set itself, so its own model is not read back as
the parent's:

```ts
let fetched: unknown;
const given = ref(0);
watch(
  () => props.modelValue,
  (value) => {
    if (value && toRaw(value) !== toRaw(fetched)) given.value++;
  },
);

return useDruxtModule(props, {
  async fetchData(ctx) {
    const value = ctx.model.value;
    if (value && toRaw(value) !== toRaw(fetched)) {
      item.value = value; // Given by the parent: no request.
      return;
    }
    item.value = fetched = await load(ctx);
    ctx.model.value = item.value;
  },
  restore(ctx) {
    const own = !ctx.model.value || toRaw(ctx.model.value) === toRaw(fetched);
    fetched = item.value;
    if (own) ctx.model.value = item.value;
  },
  state: { item },
  watch: () => [props.id, given.value],
});
```

During a server render, a parent bound to an empty ref sees the model only
after its next render, which never comes on the server. Render the module's
data through its wrapper or `ctx`, not the parent's own markup.

- [DruxtModule API](https://druxtjs.org/api/packages/core/runtime/useDruxtModule).

## Development tools

Add the tools as a dev dependency:

```sh
npm install --save-dev @druxt/devtools
```

With it installed, Druxt adds a Druxt tab to Nuxt DevTools. Its sections are
Missing wrappers, Quiet errors, Modules, Requests and Settings. A module that
rendered Druxt's default output is listed with the wrapper names it looked for,
and the tab offers to create one, on localhost only. Vue DevTools gets a Druxt
inspector of the page's modules and a Druxt requests timeline layer. The
console prints a summary when the page settles. Nothing is added to the page,
and a production build has none of it.

The Druxt tab is one of Nuxt DevTools' app tabs. When the window is too short
for every tab, it moves to the overflow menu at the bottom of the sidebar. Pin
it under Nuxt DevTools' Settings > Tabs to keep it at the top, or make the
sidebar scrollable under Settings > Appearance.

Without it, development prints one line saying so, and nothing else changes.
The Nuxt DevTools tab also needs `@nuxt/devtools-kit`, and Vue DevTools needs
`@vue/devtools-api`. Nuxt and Vue Router install both, and development says
which is missing when Nuxt DevTools is on.

All three are optional peer dependencies of `@druxt/core`. With pnpm's strict
layout, core finds one only when the site lists it, so add each to the site's
own dev dependencies rather than relying on another package to bring it.

Set `develMessages: 'inline'` for 1.x's inline messages in the page instead.

The tab is a `<druxt-devtools>` custom element, fed by a model with no Vue or
Nuxt dependency, both in `@druxt/devtools`.

### Extending the tools from a module

A Druxt module adds its own section, timeline events and actions to the tools
with `useDruxtDevtools()`, from a client plugin it registers with
`addDruxtDevtoolsPlugin()` from `@druxt/core/kit`. The plugin is registered in
development only, and every call does nothing without the tools, so a module
never imports `@druxt/devtools` and never checks for it.

- `section({ id, label }, provider)` adds a tab in Nuxt DevTools, a node in Vue
  DevTools' Druxt inspector and lines in the console summary. The provider
  returns data, never markup: `pairs` (keys and values), `table` (columns and
  rows) and `tree` (any JSON value). It is read again on each page and as
  modules report, or on `refresh()`.
- `event(label, detail)` adds an event to the timeline beside the requests.
- `action({ id, label, section }, handler)` offers a button whose handler runs
  in the app.
- `note()` and `removeNote()` add and clear a note on a module, as
  `addModuleNote()` and `removeModuleNote()` do.

The router's Route section is built this way:

```ts
// In the module's setup.
addDruxtDevtoolsPlugin(nuxt, await resolvePath(resolve('./runtime/plugins/devtools')));
```

```ts
// runtime/plugins/devtools.ts
export default defineNuxtPlugin(() => {
  const route = useRoute();
  const store = useDruxtRouterStore();
  const section = useDruxtDevtools().section({ id: 'route', label: 'Route' }, () => [
    {
      type: 'pairs',
      items: {
        path: route.path,
        'entity type': store.route.props?.type ?? '',
        'entity uuid': store.route.entity?.uuid ?? '',
        // The URL's language prefix: empty for the unprefixed default language.
        'language prefix': route.meta.langcode ?? '',
      },
    },
  ]);
  watch(
    () => [route.path, route.meta.langcode, store.route],
    () => section.refresh(),
    { deep: true },
  );
});
```

## Error codes

A development error Druxt reports names its code, `DRUXT_E` and five digits, so it can be found here. Each package has a code space of its own, its first two digits:

| Package             | Codes |
| ------------------- | ----- |
| `@druxt/core`       | 01xxx |
| `@druxt/schema`     | 02xxx |
| `@druxt/router`     | 03xxx |
| `@druxt/entity`     | 04xxx |
| `@druxt/views`      | 05xxx |
| Druxt auth          | 06xxx |
| `@druxt/devtools`   | 07xxx |
| `@druxt/blocks`     | 08xxx |
| `@druxt/menu`       | 09xxx |
| `@druxt/breadcrumb` | 10xxx |

| Code           | Meaning and what to do                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DRUXT_E01001` | Drupal omitted resources of a type from a response, quoting its reason, such as missing permissions, so what renders from it is incomplete. Read it as a user who may see them, such as through the server client with the build credentials. In development, the Druxt DevTools tab marks the request as partial.                                                                                                                               |
| `DRUXT_E01004` | Browser sign-in is on, with `druxt.auth`, and `druxt.auth.scope` is empty. On Simple OAuth 6 a token holds only the roles its scopes name, so a signed-in editor reads less than an anonymous visitor. Set `druxt.auth.scope` to the scopes of the roles your editors need. In development, the Druxt DevTools tab names a read the scope refused.                                                                                               |
| `DRUXT_E01006` | The build stopped, as `druxt.endpoint`, with or without a language prefix, is at or under `/api/_druxt`, where Druxt's own server routes are, or `druxt.proxy.files` overlaps it. Set `druxt.endpoint` to the path Drupal serves JSON:API at, such as `/jsonapi` or `/api`, outside `/api/_druxt`.                                                                                                                                               |
| `DRUXT_E01007` | The token route refused a sign-in, or ended a session on a refresh, as Drupal's access or refresh token would make its cookie larger than the 4096 bytes a browser keeps of one cookie, which the browser would drop. It answers 502, and the browser is signed out. The server's log names the token and its size, never its value. Give the Simple OAuth token fewer scopes or shorter-lived claims, or sign it with a smaller key, in Drupal. |

## Where to go next

- New to Druxt? Start with the [Getting started tutorial](https://druxtjs.org/tutorials/getting-started).
- Ready for the full site experience? See the [Site module](https://druxtjs.org/modules/site).

---

## Modules

- [@druxt/blocks](https://druxtjs.org/modules/blocks) - Decoupled Blocks and Regions
- [@druxt/breadcrumb](https://druxtjs.org/modules/breadcrumb) - Router based Breadcrumbs
- [@druxt/entity](https://druxtjs.org/modules/entity) - Decoupled Content entities, forms and fields
- [@druxt/menu](https://druxtjs.org/modules/menu) - Decoupled Menus
- [@druxt/router](https://druxtjs.org/modules/router) - Decoupled Router
- [@druxt/schema](https://druxtjs.org/modules/schema) - Drupal Display mode schemas
- [@druxt/site](https://druxtjs.org/modules/site) - A decoupled Drupal site from one module
- [@druxt/views](https://druxtjs.org/modules/views) - Decoupled Views

---

## Links

- Documentation: https://druxtjs.org
- Community Discord server: https://discord.druxtjs.org
- Demo - Umami Food Magazine:
  - https://demo.druxtjs.org
  - https://storybook.umami.demo.druxtjs.org

---

## Support

Druxt is an open-source project, built by the community for the community.

Find support or get involved in building Druxt via the community channels:

- [DruxtJS Discord server](https://discord.druxtjs.org)
- **#druxt** Slack channel on [Drupal.org slack](https://drupal.org/slack)

---

## Contributing

[![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/druxt/druxt.js)

See the [Contributing guide](https://github.com/druxt/druxt.js/blob/HEAD/CONTRIBUTING.md).

Before a change to a runtime option is done:

- Prove a runtime option by changing it after the build, not only by its presence in config.

---

## License

[MIT](https://github.com/druxt/druxt.js/blob/HEAD/LICENSE)
