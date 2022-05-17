---
title: Multilingual content
weight: -5
---

# Multilingual content

Druxt has support for multilingual content in all modules and in various forms:
- The DruxtClient and Store can fetch translated resources and collections
- Druxt module components can specify language with the **langcode** prop
- Theming can be done in language specific components

* * *

## Getting started

The following Drupal patches are required to enable multilingual content in the JSON:API:

- Decoupled Router:  
  - Issue: https://www.drupal.org/project/decoupled_router/issues/3111456  
  - Patch: https://git.drupalcode.org/project/decoupled_router/-/merge_requests/5.diff

- Druxt (Decoupled View routes):  
  - Issue: https://www.drupal.org/project/druxt/issues/3273228  
  - Patch: https://git.drupalcode.org/project/druxt/-/merge_requests/9.diff

- JSON:API Menu Items:  
  - Issue: https://www.drupal.org/project/jsonapi_menu_items/issues/3192576  
  - Patch: https://git.drupalcode.org/project/jsonapi_menu_items/-/merge_requests/7.diff

### tl;dr

Add the following to your composer.json patches:
```json
"drupal/druxt": {
    "https://www.drupal.org/project/druxt/issues/3273228": "https://git.drupalcode.org/project/druxt/-/merge_requests/9.diff"
},
"drupal/decoupled_router": {
    "https://www.drupal.org/project/decoupled_router/issues/3111456#comment-14093342": "https://git.drupalcode.org/project/decoupled_router/-/merge_requests/5.diff"
},
"drupal/jsonapi_menu_items": {
    "https://www.drupal.org/project/jsonapi_menu_items/issues/3192576#comment-14473856": "https://git.drupalcode.org/project/jsonapi_menu_items/-/merge_requests/7.diff"
}
```

* * *

## Fetching a translated resource

All DruxtClient and DruxtStore methods and actions have support for a langcode prefix, falling back to the default language, as determined by the Drupal backend.

_Example: Fetching a spanish recipe from the DruxtStore_

```js
this.$store.dispatch('druxt/getResource', {
  type: 'node--page',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
  prefix: 'es'
})
```

- See the [DruxtClient](/api/packages/druxt/client) and [DruxtStore](/api/packages/druxt/stores/druxt) API docs.

* * *

## Langcode prop

DruxtModule components have a **langcode** prop to specify the language, as well as a computed **lang** prop containing the fallback languge if no langcode prop is provided.

_Example: Rendering a DruxtEntity component in spanish_

```jsx
<DruxtEntity
  type="node--page"
  id="d8dfd355-7f2f-4fc3-a149-288e4e293bdd"
  langcode="es"
/>
```

- See the [DruxtModule](/api/packages/druxt/components/DruxtModule) component documentation.

* * *

## Language theme components

All Druxt modules provide language specific theme component options, allowing for language specific customisations.

_Example: `~/components/druxt/entity/node/page/Es.vue`_
