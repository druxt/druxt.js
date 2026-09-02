---
title: Serve content in multiple languages
weight: -5
description: Fetch and render Drupal content in more than one language, using langcode prefixes across the client, the store and Druxt module components.
---

Druxt has support for multilingual content in all modules:

- The DruxtClient and Store can fetch translated resources and collections
- Druxt module components can specify language with the **langcode** prop
- Theming can be done in language-specific components

> **Before you start:** this guide assumes a working Druxt site (see
> [Getting started](/tutorials/getting-started)) with at least two languages
> enabled in Drupal and URL path prefixes configured
> (**Configuration → Regional and language → Languages**).

---

## Required Drupal patches

Translated route resolution needs patches on `decoupled_router` until
[#3111456](https://www.drupal.org/project/decoupled_router/issues/3111456)
is released. The reference backend pins `drupal/decoupled_router` to `2.0.5`
and applies three:

```json
"drupal/decoupled_router": {
  "https://www.drupal.org/project/decoupled_router/issues/3172926": "https://www.drupal.org/files/issues/2020-09-24/3172926-2.patch",
  "https://www.drupal.org/project/decoupled_router/issues/3468825": "https://git.drupalcode.org/project/decoupled_router/-/merge_requests/20.diff",
  "#3111456 Resolve the language from the requested path": "patches/decoupled_router-3111456-resolve-language-from-path.patch"
}
```

The #3111456 patch is rerolled against `2.0.5`. The files attached to the issue
target earlier releases and do not apply cleanly, so take the rerolled copy from
[`docs/drupal/patches/`](https://github.com/druxt/druxt.js/tree/develop/docs/drupal/patches).

Translated **Views** routes need one more, on `druxt` itself:
[#3273228](https://www.drupal.org/project/druxt/issues/3273228), also carried as
a rerolled patch in that directory.

`jsonapi_menu_items` has included language support since `1.2.4`; no patch
required.

---

## Fetching a translated resource

All DruxtClient and DruxtStore methods and actions have support for a langcode prefix, falling back to the default language, as determined by the Drupal backend.

_Example: Fetching a spanish recipe from the DruxtStore_

```js
this.$store.dispatch('druxt/getResource', {
  type: 'node--page',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
  prefix: 'es',
});
```

- See the [DruxtClient](/api/packages/druxt/client) and [DruxtStore](/api/packages/druxt/stores/druxt) API docs.

---

## Langcode prop

DruxtModule components have a **langcode** prop to specify the language, as well as a computed **lang** prop containing the fallback language if no langcode prop is provided.

_Example: Rendering a DruxtEntity component in spanish_

```jsx
<DruxtEntity type="node--page" id="d8dfd355-7f2f-4fc3-a149-288e4e293bdd" langcode="es" />
```

- See the [DruxtModule](/api/packages/druxt/components/DruxtModule) component documentation.

---

## Language theme components

All Druxt modules provide language-specific theme component options, allowing for language-specific customisations.

_Example: `~/components/druxt/entity/node/page/Es.vue`_
