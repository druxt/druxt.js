<img src="https://raw.githubusercontent.com/druxt/druxt.js/HEAD/packages/druxt/banner.svg" alt="Druxt: the core client, store and DruxtModule base">

# Druxt

[![npm](https://badgen.net/npm/v/druxt)](https://www.npmjs.com/package/druxt)
[![dev](https://badgen.net/npm/v/druxt/dev)](https://www.npmjs.com/package/druxt/v/dev)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> The core module, DruxtClient, DruxtStore and the DruxtModule base component.

The core `druxt` package is the foundation every other Druxt module builds
on. It provides the three pieces the whole framework shares:

- **[DruxtClient](#druxtclient)**: the Drupal JSON:API communication layer.
- **[DruxtStore](#druxtstore)**: the Vuex module caching resources and
  collections for all modules.
- **[DruxtModule](#druxtmodule)**: the base component behind the
  theme-component suggestion system.

## Installation

1. Install the package:

   ```sh
   npm i druxt
   ```

2. Add the module and your backend URL to `nuxt.config.js`:

   ```js
   export default {
     modules: [['druxt', { baseUrl: 'https://api.umami.demo.druxtjs.org' }]],
   };
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

Every change merged to `develop` is published under the `dev` tag:

```sh
npm i druxt@dev
```

These are unreleased builds. See [development releases](https://druxtjs.org/how-to/use-development-releases) before using one.

## Compatibility

As of September 2026. See the [releases](https://github.com/druxt/druxt.js/releases) for the current version.

|               | Supported                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nuxt          | 2.15 or later (Nuxt 2 line). Nuxt 3 is not supported.                                                                                                                                                                 |
| Vue           | 2.7                                                                                                                                                                                                                   |
| Node          | 16, the tested version. Node 16 is past upstream end of life. The 1.x line targets it deliberately. 17 and later need `NODE_OPTIONS=--openssl-legacy-provider` to build.                                              |
| Drupal core   | 10 or 11. `drupal/druxt` 1.2.2 declares `^10 \|\| ^11 \|\| ^12` and ended 8 and 9 support. 12 is declared but waits on Decoupled Router and JSON:API Menu Items. Tested against 10 and 11.                            |
| Drupal module | `drupal/druxt` ^1.2.2, which brings `decoupled_router`, `jsonapi_menu_items` and `jsonapi_views`. Earlier 1.2.x releases are incompatible with Decoupled Router 2.0.7 ([#3618675](https://www.drupal.org/i/3618675)). |
| Known pins    | `@nuxtjs/storybook` 4.2.0 (later majors need Nuxt 3). Axios 0.x, or add it to `build.transpile`                                                                                                                       |

What these bounds promise over time is stated in the
[support and versioning policy](https://druxtjs.org/explanation/support-and-versioning).

Translated routes also need a `decoupled_router` patch; see the
[multilingual guide](https://druxtjs.org/how-to/multilingual).

## Settings

| Option        | Type              | Default      | Description                                                              |
| ------------- | ----------------- | ------------ | ------------------------------------------------------------------------ |
| `baseUrl`     | `string`          |              | The Drupal backend URL. **Required.**                                    |
| `endpoint`    | `string`          | `'/jsonapi'` | The JSON:API endpoint path.                                              |
| `proxy.api`   | `boolean`         | `false`      | Proxy API requests via Nuxt ([guide](https://druxtjs.org/how-to/proxy)). |
| `proxy.files` | `boolean\|string` | `false`      | Proxy Drupal files. A string sets the site.                              |
| `cache`       | `boolean\|object` | `{}`         | The server cache, see below. `false` turns it off.                       |

See the [Nuxt module API](https://druxtjs.org/api/packages/druxt/nuxt) for the full
options list.

## Server cache

In production, the server keeps the JSON:API index and menus between requests
for as long as Drupal's `Cache-Control` header allows. Drupal sets that header
from the page cache maximum age (Administration > Configuration > Development >
Performance). At the default of 0, nothing is kept. A request with an
`Authorization` header or a Drupal session cookie never reads or fills the
cache. The cache is off under `nuxt dev`.

| Option                | Type     | Default             | Description                                                         |
| --------------------- | -------- | ------------------- | ------------------------------------------------------------------- |
| `cache.ttl`           | `number` |                     | Seconds a response may be kept at most. `0` keeps nothing.          |
| `cache.secret`        | `string` |                     | Turns on `POST /_druxt/cache/clear`.                                |
| `cache.sessionCookie` | `string` | `'S?SESS[0-9a-f]+'` | A pattern for the session cookie name, for a proxy that renames it. |

Clear the cache from the app with `this.$store.dispatch('druxt/clearCache')`,
or from Drupal by sending `POST /_druxt/cache/clear` with the secret in an
`X-Druxt-Secret` header. Each Nuxt process has its own cache, so a site with
several processes clears each one.

### Clearing from Drupal with Purge

The [Purge](https://www.drupal.org/project/purge) module can send that request
whenever content changes. Enable `purge`, `purge_purger_http`,
`purge_queuer_coretags` and a processor such as `purge_processor_lateruntime`,
then add the bundled HTTP purger:

```sh
drush p:purger-add httpbundled
```

Give it the method `POST`, the Nuxt host and port, the path
`/_druxt/cache/clear`, a header `X-Druxt-Secret` with the secret, and the
invalidation type `tag`. One save then costs one request, whatever it
invalidates, and a request refused for a wrong secret is sent again with the
next batch. Keep the secret out of exported configuration: set it from
`settings.php` as a `$config` override.

## DruxtClient

The client is the communication layer between your application and Drupal's
JSON:API: resources, collections, indexing and authentication all flow
through it.

```js
import { DruxtClient } from 'druxt';

const client = new DruxtClient('https://api.umami.demo.druxtjs.org');
const collection = await client.getCollection('node--article');
```

- [Use the Druxt client directly](https://druxtjs.org/how-to/use-the-druxt-client): practical
  guide, including non-Nuxt usage.
- [DruxtClient API](https://druxtjs.org/api/packages/druxt/client): full method reference.

## DruxtStore

The Vuex module that all Druxt modules share: request deduplication, the
resource/collection cache, and include handling.

```js
const resource = await this.$store.dispatch('druxt/getResource', {
  type: 'node--article',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
});
```

- [The DruxtStore concept page](https://druxtjs.org/explanation/druxt-store): how it works
  and why it exists.
- [DruxtStore API](https://druxtjs.org/api/packages/druxt/stores/druxt): mutations and
  actions.
- [Deprecations](https://druxtjs.org/modules/druxt/deprecations): retired signatures.

## DruxtModule

The base component for all Druxt components: it turns a `druxt()` options
object (component suggestions, props, slots) into themeable rendering.
Building on it is covered by the
[custom module tutorial](https://druxtjs.org/tutorials/first-custom-module), and the mechanism
by [Component resolution](https://druxtjs.org/explanation/component-resolution).

- [DruxtModule API](https://druxtjs.org/api/packages/druxt/components/DruxtModule).

## Where to go next

- New to Druxt? Start with the [Getting started tutorial](https://druxtjs.org/tutorials/getting-started).
- Ready for the full site experience? See the [Site module](https://druxtjs.org/modules/site).

---

## Modules

- [druxt-blocks](https://druxtjs.org/modules/blocks) - Decoupled Blocks and Regions
- [druxt-breadcrumb](https://druxtjs.org/modules/breadcrumb) - Router based Breadcrumbs
- [druxt-entity](https://druxtjs.org/modules/entity) - Decoupled Content entities, forms and fields
- [druxt-menu](https://druxtjs.org/modules/menu) - Decoupled Menus
- [druxt-router](https://druxtjs.org/modules/router) - Decoupled Router
- [druxt-schema](https://druxtjs.org/modules/schema) - Drupal Display mode schemas
- [druxt-site](https://druxtjs.org/modules/site) - Out-of-the-box decoupled Drupal Site
- [druxt-views](https://druxtjs.org/modules/views) - Decoupled Views

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

See the [Contributing guide](https://github.com/druxt/druxt.js/blob/develop/CONTRIBUTING.md).

---

## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)
