---
title: Getting started with Druxt.js
weight: -9
---

### Getting started with Druxt.js

> Druxt is a Fully Decoupled Drupal framework.

Druxt gives you the tools to connect your Nuxt.js frontend to your Drupal JSON:API backend.

* * *

## Getting started

All Druxt sites and applications need both Drupal (backend) and Nuxt (frontend) to be installed.

Each codebase can live in its own directory within a single repository, or exist in seperate repositories.

* * *

### Drupal

1. [Install Drupal](https://www.drupal.org/docs/installing-drupal)

2. Download the Drupal [Druxt module](https://www.drupal.org/project/druxt):

    ```sh
    composer require drupal/druxt
    ```

3. Install the module:
   ![Install the module](/images/drupal-install.png)

4. Add the "**access druxt resources**" permission to a user/role:
   ![Druxt 'access druxt resources' permission](/images/drupal-permissions.png)

* * *

### Nuxt

1. [Install Nuxt](https://nuxtjs.org/guide/installation/)

   ```sh
   npx create-nuxt-app [destination]
   ```

2. Install the Druxt module:

    ```sh
    npm i druxt
    ```

3. Add the module and configuration to `nuxt.config.js`:

    ```js
    export default {
      modules: [
        'druxt'
      ],

      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org'
      }
    }
    ```

    \* _**Note:** Replace `https://demo-api.druxtjs.org` with your own Drupal backend._

4. Start Nuxt: `npm run dev`

* * *

## Next steps

Druxt provides tools to help build your Fully Decoupled Drupal application or site.

* * *

### Drupal JSON:API client

The `DruxtClient` is a Drupal flavoured JSON:API client, it is the primary communication layer to access your Drupal content and configuration.

The client is used by the Nuxt Vuex store, but can also be used manually in any Node application:

```js
import { DruxtClient } from 'druxt'
const client = new DruxtClient('https://demo-api.druxtjs.org')
```

- For more details, see the [DruxtClient API documentation](/api/packages/druxt/client).

* * *

### Nuxt Vuex store

The `DruxtStore` is a Vuex store that interfaces with the primary DruxtClient instance in your Nuxt application to retrieve and cache your Drupal JSON:API resources.

The store is used by the Druxt modules, but can also be used manually from within your Vue components as required:

```vue
<script>
export default {
  data: () => ({
    entity: null,
  }),
  async fetch() {
    this.entity = await this.$store.dispatch('druxt/getResource', { type: 'node--article', id })
  }
}
</script>
```

- For more details, see the [DruxtStore API documentation](/api/packages/druxt/stores/druxt).

* * *

### Druxt modules

Druxt modules provide targeted decoupled Drupal functionality via Vue components, Vuex stores and other helper tools.

Modules are installed and configured via the `nuxt.config.js` file as required:
```js
export default {
  modules: ['druxt-site']
}
```

- For a list of available modules, see the [Druxt Modules page](/modules).