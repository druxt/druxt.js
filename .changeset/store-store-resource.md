---
'druxt': minor
---

feat(#1019): the new `druxt/storeResource` action stores a resource that is newer than any request for it, such as Drupal's answer to a save. A request that started before it no longer replaces it when its answer arrives, whether the request is for the resource itself, a collection that holds it or another resource that includes it. The rest of that answer is stored as before.

```js
const response = await this.$druxt.updateResource(resource, prefix);
this.$store.dispatch('druxt/storeResource', { resource: response.data, prefix });
```

`druxt/addResource` is unchanged, and a request that started before it can still replace what it stored.
