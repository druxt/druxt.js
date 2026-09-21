---
'druxt': minor
---

Wrapper components no longer render the module data they receive. An entity rendered `<div entity="[object Object]" fields="[object Object]">`, a block region rendered `name="page_title" theme="umami"`, and a module's own attributes appeared on two elements. Wrappers still read all of it from `$attrs`. An `id` now stays on the module it was set on rather than repeating on each module below. Everything else still passes down the chain.

**Attributes you may be selecting on are gone.** Use a class:

```vue
<DruxtBlockRegion :class="`region region-${region}`" v-bind="props[region]" />
```

```js
cy.get('.region-page_title'); // was: div[name="page_title"]
```

Not `data-fetch-key`: it is missing on some render paths, so it passes in the browser and fails on a server rendered visit.

To keep the old markup, give the module a wrapper component of your own, which keeps Vue's default. Registering your own `DruxtWrapper` does not work, because each module registers one locally.
