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
- **DruxtModule**: `useDruxtModule()`, the contract behind the
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

- The method and the headers pass through, and the body streams through. `Host`, `Accept` and `Accept-Encoding` are not forwarded, so Drupal sees its own host.
- `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto` are set from the site's own view of the request. Any forwarding header the browser sent is dropped, along with `Forwarded`, `X-Forwarded-Port`, `X-Forwarded-Server` and `X-Real-IP`.
- A path under `/api/_druxt` never reaches Drupal. One no Druxt route takes, such as a `GET` to the `POST` token route, answers 404, where a proxy at `/api/**` would otherwise take it.
- A redirect passes through to the browser. A `Location` on Drupal's base URL becomes the same path on the site, always a path that starts with one `/`. A `Location` on another host is left as it is, as any reverse proxy leaves it, so the browser follows Drupal's redirect off the site.
- A cookie Drupal sets for its own host is set for the site's host.
- Of the browser's cookies, Drupal gets only its own session cookie, `SESS` or `SSESS` and a hash, or the one `cache.sessionCookie` matches. Druxt's `druxt.auth.*` cookies, another module's, such as nuxt-auth-utils' `nuxt-session`, and the site's own never reach Drupal, and a request with none of Drupal's sends no `Cookie` header. When the site's server holds the sign-in, the proxy sends the access token from its cookie as the `Authorization` header. A request that sends its own header keeps it, and the proxy doesn't add credentials to one that sends `X-Druxt-Auth: none`. A token cookie that doesn't decode, such as a bare `%`, counts as none, and the request goes to Drupal anonymously.
- The response's encoding and length headers are recomputed, and the others come back as Drupal sent them.

Behind a front proxy, such as a hosting platform's nginx, Drupal sees that proxy as every visitor, which its flood control counts as one. Set `proxy.trustForwarded`, or `NUXT_DRUXT_PROXY_TRUST_FORWARDED=true` at runtime, to pass the front proxy's headers on: the visitor's address is added to its `X-Forwarded-For` chain, and its `X-Forwarded-Host`, `X-Forwarded-Proto` and the other forwarding headers pass through. It is safe only when a front proxy the site trusts sets those headers on every request, since otherwise a browser can forge them. It is server only, in the private runtime config.

Druxt's own server routes sit under `/api/_druxt`, such as `/api/_druxt/cache/clear` and `/api/_druxt/auth/token`, in Nitro's `/api` namespace. Many Drupal sites serve JSON:API at `/api`. Set `endpoint: '/api'` with `proxy.api` on, and the proxy takes `/api/**` while Druxt's routes and the site's own `server/api` routes answer first, so Drupal never sees them. A route answers only its own methods, so a request to a route of the site's, or of another module, with a method that route doesn't take goes through the proxy to Drupal, such as a `GET` to a `POST`-only `server/api/login.post.ts`. Only Druxt's own paths answer 404 for one. A JSON:API endpoint at or under `/api/_druxt`, with or without a language prefix, fails the build with `DRUXT_E01006`. Modules read the path from `DRUXT_API_BASE`, in `@druxt/core/routes` and `@druxt/core/kit`.

The JSON:API is proxied under each language's URL prefix as Drupal is configured, such as `/english/jsonapi` for `en`. The build reads the prefixes from Drupal. The default language's comes from the unprefixed index and each other language's from a probe at its langcode. When the decoupled_settings module publishes `language.negotiation` to visitors, the build reads every prefix from it, which is the one way to learn a prefix that is neither. A default language with no prefix is served unprefixed. A prefix the build cannot read is taken to be the langcode, with a warning. When the build can't read the languages at all, such as with build credentials Drupal refuses, it warns once and goes on with none. The proxy then serves only the unprefixed endpoint, and a request under a language prefix misses it until a build reads them. The prefixes are read at build, so rebuild after changing them in Drupal. The client gets the same map, so a module's language reaches Drupal under the prefix it is served at.

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

`clearCache()` empties the client's caches and every Druxt store. The edit store's drafts are unsaved edits, so they stay. `clearCache({ drafts: true })` closes them too, and a sign-in and a sign-out call it that way, so one user's unsaved edits never reach the next.

- [The DruxtStore concept page](https://druxtjs.org/explanation/druxt-store): how it works
  and why it exists.
- [DruxtStore API](https://druxtjs.org/api/packages/core/runtime/store): its state
  and actions.
- [Deprecations](https://druxtjs.org/modules/druxt/deprecations): retired signatures.

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
