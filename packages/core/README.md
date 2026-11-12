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
