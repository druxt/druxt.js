---
'druxt-schema': minor
---

feat(#127): schemas can follow display changes in Drupal without a rebuild. Set `druxt.schema.refresh`, and the Nuxt server regenerates them after each cache clear. A server that serves one site does so even when it starts with a different `baseUrl` from its build, as a container often does. The [druxt-schema README](https://github.com/druxt/druxt.js/tree/HEAD/packages/schema#refresh-schemas-without-a-rebuild) covers it, including `createSchemaRefresh` for a static site's own Node server.

```js
// nuxt.config.js
export default {
  druxt: {
    schema: { refresh: true },
  },
};
```
