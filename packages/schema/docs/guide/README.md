---
title: Introduction
---

# Druxt.js Schema

The Druxt.js Schema module uses the [Drupal](https://drupal.org) JSON:API and **Display mode** configuration to build a [Vuex](https://vuex.vuejs.org) based Schema store to power your Drupal driven [Nuxt.js](https://nuxtjs.org) frontend.


## How it works?

Upon installation the module installs a Nuxt.js plugin, Vuex store and builds the required Entity Form and View schemas.

Schemas are loaded into the Vuex store on-demand through the usage of the provided Nuxt.js plugin, Vue.js mixin or Vuex module.


### Nuxt.js Plugin

The Nuxt.js plugin can be used to load the Schema as per the following example:

```js
const schema = await this.$druxtSchema.import(id)
```


### Vue.js mixin.

The Vue.js mixin will add the required props to a custom Vue.js component, as well as automatically loading in the required Schema via the `created()` method.

```vue
<script>
import { DruxtSchemaMixin } from 'druxt-schema'

export default {
  mixins: [DruxtSchemaMixin]
}
</script>
```

See the [Mixin API documentation](../api/mixins/schema) for more.


### Vuex module.

The Vuex module simplifies loading and caching of the Schema data.

```js
// Load data from store, or import if not available.
const schema = await this.$store.dispatch('druxtSchema/get', schemaConfig)
```

See the [Vuex store API documentation](../api/stores/schema) for more.
