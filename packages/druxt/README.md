<img src="./banner.svg" alt="Druxt: the core client, store and DruxtModule base">

# Druxt

[![npm](https://badgen.net/npm/v/druxt)](https://www.npmjs.com/package/druxt)
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
     modules: [['druxt', { baseUrl: 'https://demo-api.druxtjs.org' }]],
   };
   ```

   \* _Replace `https://demo-api.druxtjs.org` with your own
   Drupal backend._

3. On the Drupal side, install and enable the
   [Druxt module](https://www.drupal.org/project/druxt) and grant the
   **access druxt resources** permission to the relevant roles. Missing this
   is the most common cause of site-wide JSON:API failures. See
   [Troubleshooting](https://druxtjs.org/guide)
   if requests are failing after install.

## Settings

| Option        | Type              | Default     | Description                                                              |
| ------------- | ----------------- | ----------- | ------------------------------------------------------------------------ |
| `baseUrl`     | `string`          |             | The Drupal backend URL. **Required.**                                    |
| `endpoint`    | `string`          | `'jsonapi'` | The JSON:API endpoint path.                                              |
| `proxy.api`   | `boolean`         | `false`     | Proxy API requests via Nuxt ([guide](https://druxtjs.org/guide/proxy)). |
| `proxy.files` | `boolean\|string` | `false`     | Proxy Drupal files. A string sets the site.                              |

See the [Nuxt module API](https://druxtjs.org/api/packages/druxt/nuxt) for the full
options list.

## DruxtClient

The client is the communication layer between your application and Drupal's
JSON:API: resources, collections, indexing and authentication all flow
through it.

```js
import { DruxtClient } from 'druxt';

const client = new DruxtClient('https://demo-api.druxtjs.org');
const collection = await client.getCollection('node--article');
```

- [Use the Druxt client directly](https://druxtjs.org/guide/client): practical
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

- [The DruxtStore concept page](https://druxtjs.org/guide): how it works
  and why it exists.
- [DruxtStore API](https://druxtjs.org/api/packages/druxt/stores/druxt): mutations and
  actions.
- [Deprecations](https://druxtjs.org/modules/druxt/deprecations): retired signatures.

## DruxtModule

The base component for all Druxt components: it turns a `druxt()` options
object (component suggestions, props, slots) into themeable rendering.
Building on it is covered by the
[custom module tutorial](https://druxtjs.org/guide), and the mechanism
by [Component resolution](https://druxtjs.org/guide/theming).

- [DruxtModule API](https://druxtjs.org/api/packages/druxt/components/DruxtModule).

## Where to go next

- New to Druxt? Start with the [Getting started tutorial](https://druxtjs.org/guide/getting-started).
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
- Community Discord server: https://discord.gg/QnZD46c
- Demo - Umami Food Magazine:
  - https://demo.druxtjs.org
  - https://druxt-umami.netlify.app
  - https://umami-storybook.druxtjs.org

---

## Support

Druxt is an open-source project, built by the community for the community.

Find support or get involved in building Druxt via the community channels:

- [DruxtJS Discord server](https://discord.gg/QnZD46c)
- **#druxt** Slack channel on [Drupal.org slack](https://drupal.org/slack)

---

## License

[MIT](https://github.com/druxt/druxt.js/blob/develop/LICENSE)
