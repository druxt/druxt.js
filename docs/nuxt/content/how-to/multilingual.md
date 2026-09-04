---
title: Serve content in multiple languages
weight: -4
description: Fetch and render translated Drupal content with langcode prefixes, from the route to the store to language-specific theme components.
---

> **Before you start:** this guide assumes a working Druxt site (see
> [Getting started](/tutorials/getting-started)) with at least two
> languages enabled in Drupal and URL path prefixes configured
> (**Configuration → Regional and language → Languages**).

Multilingual support runs through every layer: the router resolves
prefixed paths, the client and store fetch translated resources, module
components take a `langcode` prop, and the theme layer resolves
language-specific components. This guide walks one translated page
through all four.

## Patch the router

Translated route resolution needs one patch on `decoupled_router` until
[#3111456](https://www.drupal.org/project/decoupled_router/issues/3111456)
is released:

```json
"drupal/decoupled_router": {
  "https://www.drupal.org/project/decoupled_router/issues/3111456#comment-15211077": "https://www.drupal.org/files/issues/2023-08-30/decoupled_router-3111456-resolve_lang-66.patch"
}
```

The symptom without it is quiet: prefixed routes resolve, but to the
default language.

Menus need `jsonapi_menu_items` 1.2.4 or later. Translated **Views**
routes do not resolve yet, tracked in
[druxt#3273228](https://www.drupal.org/project/druxt/issues/3273228).

## Fetch a translated resource

The DruxtClient resource methods (`getResource`, `getCollection`,
`getCollectionAll`, `getIndex`) and the matching DruxtStore actions
take a langcode `prefix`, falling back to the backend's default
language when omitted:

```js
this.$store.dispatch('druxt/getResource', {
  type: 'node--page',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
  prefix: 'es',
});
```

(Take a real `id` from your backend's `/jsonapi/node/page` listing;
demo ids change with every reinstall.) The prefix maps straight onto
Drupal's prefixed endpoints: `/es/jsonapi/...` serves the Spanish
variants.

## Render in a language

Module components take a `langcode` prop, and expose the resolved
language (prop or fallback) as the computed `lang`:

```vue
<DruxtEntity type="node--page" :id="id" langcode="es" />
```

On a routed page you rarely set this by hand: the wildcard route
carries the language of the path it resolved, and the components
inherit it.

## Theme per language

The [component suggestion chain](/explanation/component-resolution)
tries a langcode-suffixed variant of every candidate first, so a
language-specific wrapper is just a more specific file:

```text
components/druxt/entity/node/page/Default.vue     every language
components/druxt/entity/node/page/DefaultEs.vue   Spanish only
```

`DefaultEs.vue` wins for `langcode: 'es'`. Every other language renders
`Default.vue`. Use it for the cases where translation
changes the design: reversed text direction, longer labels, a
language-specific asset.

## Where to go next

- [Component resolution](/explanation/component-resolution): where the
  langcode suffix sits in the full lookup order.
- [Decoupled routing](/explanation/routing): how prefixed paths reach
  Drupal at all.
- [Use the Druxt client directly](/how-to/use-the-druxt-client): the
  `prefix` parameter on every method.
