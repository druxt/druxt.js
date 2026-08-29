---
title: Druxt
description: The core module, DruxtClient, DruxtStore and the DruxtModule base component.
---

# Druxt

The core `druxt` package is the foundation every other Druxt module builds
on. It provides the three pieces the whole framework shares:

- **[DruxtClient](#druxtclient)**: the Drupal JSON:API communication layer.
- **[DruxtStore](#druxtstore)**: the Vuex module caching resources and
  collections for all modules.
- **[DruxtModule](#druxtmodule)**: the base component behind the
  theme-component suggestion system.

## Installation

1. Download the module:

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
   [Troubleshooting](/how-to/troubleshooting#every-jsonapi-request-403s-even-for-content-that-should-be-public)
   if requests are failing after install.

## Settings

| Option        | Type              | Default     | Description                                           |
| ------------- | ----------------- | ----------- | ----------------------------------------------------- |
| `baseUrl`     | `string`          |             | The Drupal backend URL. **Required.**                 |
| `endpoint`    | `string`          | `'jsonapi'` | The JSON:API endpoint path.                           |
| `proxy.api`   | `boolean`         | `false`     | Proxy API requests via Nuxt ([guide](/how-to/proxy)). |
| `proxy.files` | `boolean\|string` | `false`     | Proxy Drupal files. A string sets the site.           |

See the [Nuxt module API](/api/packages/druxt/nuxtModule) for the full
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

- [Use the Druxt client directly](/how-to/use-the-druxt-client): practical
  guide, including non-Nuxt usage.
- [DruxtClient API](/api/packages/druxt/client): full method reference.

## DruxtStore

The Vuex module that all Druxt modules share: request deduplication, the
resource/collection cache, and include handling.

```js
const resource = await this.$store.dispatch('druxt/getResource', {
  type: 'node--article',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
});
```

- [The DruxtStore concept page](/explanation/druxt-store): how it works
  and why it exists.
- [DruxtStore API](/api/packages/druxt/stores/druxt): mutations and
  actions.
- [Deprecations](/modules/druxt/deprecations): retired signatures.

## DruxtModule

The base component for all Druxt components: it turns a `druxt()` options
object (component suggestions, props, slots) into themeable rendering.
Building on it is covered by the
[custom module tutorial](/tutorials/first-custom-module), and the mechanism
by [Component resolution](/explanation/component-resolution).

- [DruxtModule API](/api/packages/druxt/components/DruxtModule).

## Where to go next

- New to Druxt? Start with the [Getting started tutorial](/tutorials/getting-started).
- Ready for the full site experience? See the [Site module](/modules/site).

---

## Package README

The full npm package README (features, badges, install) is mirrored as the [generated package README page](/modules/druxt/readme).
