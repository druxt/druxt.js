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

## Patch the backend

Multilingual routing depends on fixes that are not released yet, and it
takes more than one. The reference backend applies six patches, three to
`decoupled_router` and three to `druxt`, and the working set is
[`docs/drupal/composer.json`](https://github.com/druxt/druxt.js/blob/develop/docs/drupal/composer.json)
in this repository. Copy the `extra.patches` block from there rather than
assembling one from issue pages, and read
[`docs/drupal/patches/README.md`](https://github.com/druxt/druxt.js/blob/develop/docs/drupal/patches/README.md),
which records why each is needed and which dependency version it was cut
against.

What the six are for:

| Project | Issue | Without it |
| ------- | ----- | ---------- |
| decoupled_router | [#3111456](https://www.drupal.org/i/3111456) | Prefixed paths resolve, but always in the default language |
| decoupled_router | [#3172926](https://www.drupal.org/i/3172926) | Unpublished and inaccessible paths resolve inconsistently |
| decoupled_router | [#3468825](https://www.drupal.org/i/3468825) | Redirects are not followed to their destination |
| druxt | [#3273228](https://www.drupal.org/i/3273228) | Views routes, the front page among them, resolve in the default language and return no langcode |
| druxt | [#3315030](https://www.drupal.org/i/3315030) | Wildcard routes are not translated |
| druxt | [#3467742](https://www.drupal.org/i/3467742) | A view with no `view_id` throws instead of falling through |

Two of them, #3111456 and #3273228, are local rerolls committed to this
repository rather than URLs. The versions on the issues do not apply
cleanly to the releases the backend pins, which is the whole reason the
rerolls exist, so take the committed files rather than the issue
attachments.

**A patch is cut against one dependency version.** The druxt rerolls here
target `drupal/druxt` 1.2.0 and do not apply to 1.2.1 or later, because
1.2.1 added an import the patch also adds and 1.2.2 rewrote most of the
file. Check the version before copying.

The symptom of a missing patch is quiet rather than loud: prefixed routes
keep resolving, just to the wrong language, so it reads as content not
being translated rather than as routing being broken.

Menus need `jsonapi_menu_items` 1.2.4 or later.

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
