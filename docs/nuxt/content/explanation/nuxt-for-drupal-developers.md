---
title: Nuxt for Drupal developers
weight: -8
description: 'The Nuxt and Vue concepts behind a Druxt frontend, mapped to the Drupal ideas they replace.'
---

Druxt's frontend is a [Nuxt](https://v2.nuxt.com) application, so building
a Druxt site means working in JavaScript tooling that has no Drupal
equivalent installed. This page maps the Nuxt and Vue concepts these docs
use onto the Drupal ideas they replace. If you come from the JavaScript
side instead, read
[Drupal for Nuxt developers](/explanation/drupal-for-nuxt-developers).

## What Nuxt does in a Druxt project

Nuxt is a framework built on [Vue](https://v2.vuejs.org), and it owns
everything a Drupal theme would: markup, styling, navigation and the
request/render lifecycle. Druxt targets **Nuxt 2** (and Vue 2); check the
[compatibility table](/modules/druxt) before reaching for newer
releases. Instead of PHP rendering Twig on each request, Nuxt renders Vue
components on a Node.js server, or ahead of time into static files, and then
**hydrates** in the browser: the JavaScript takes over the rendered page
and makes it interactive. [Request
topology](/explanation/request-topology) covers what runs where.

## The mapping

| Drupal idea                             | Nuxt/Vue counterpart               | Notes                                                                                                                                     |
| --------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Twig template                           | Vue component                      | Markup, logic and styling in one `.vue` file                                                                                              |
| Theme hook suggestions                  | Druxt component suggestions        | The deliberate twin; see below                                                                                                            |
| Region                                  | Layout with `<slot>` or `<nuxt />` | Layouts wrap pages the way `page.html.twig` wraps content                                                                                 |
| Module                                  | Nuxt module or plugin              | Configured in `nuxt.config.js`                                                                                                            |
| `settings.php`                          | `nuxt.config.js`                   | One file, JavaScript, in version control                                                                                                  |
| Composer                                | npm (or yarn)                      | `package.json` is `composer.json`, `npm install` restores the tree                                                                        |
| drush                                   | npm scripts                        | `npm run dev`, `npm run generate` and friends, defined per project                                                                        |
| Cache rebuild                           | Restart the dev server, or rebuild | Config changes need a restart. Content is live in dev and SSR; a generated static build embeds it, so content changes need a regeneration |
| Routing (`*.routing.yml`, path aliases) | The Druxt wildcard route           | Drupal keeps owning paths; see [Decoupled routing](/explanation/routing)                                                                  |

## The part that will feel familiar

Druxt's theming system is modeled on Drupal's template suggestions. Where
Drupal looks for `node--article--teaser.html.twig` before falling back to
`node.html.twig`, Druxt looks for `DruxtEntityNodeArticleTeaser.vue`
before `DruxtEntityNodeArticle.vue` and so on down to the default. You
override rendering by dropping a more specific component into
`components/`, exactly the reflex you have from theming.
[Component resolution](/explanation/component-resolution) shows the full
lookup order, and [Theme Druxt components](/how-to/theming) is the
hands-on guide.

## The Vue you actually need

A `.vue` file can hold three sections, each optional: `<template>` (the markup, with
`{{ variable }}` interpolation much like Twig), `<script>` (the
component's data and behavior) and `<style>`. Data flows into components
through **props**, roughly the variables a preprocess function hands a
template. Named **slots** are insertion points a wrapper exposes, the
concept behind Druxt's themeable wrappers. The examples in these docs
use nothing beyond those three ideas. Deeper Vue can wait until you
need it.

## Files that matter

| File             | Role                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| `nuxt.config.js` | All frontend configuration, including every Druxt module's options       |
| `package.json`   | Dependencies and the `npm run` scripts                                   |
| `components/`    | Your overrides; anything here is auto-discovered                         |
| `pages/`         | File-based routing; mostly empty in Druxt, the wildcard route handles it |
| `static/`        | Files served as-is, like a document root                                 |

## What you can skip

Vuex internals (the [DruxtStore](/explanation/druxt-store) manages state
for you), webpack configuration (Nuxt owns it) and hand-written REST
calls (the DruxtClient makes them). You keep working in the Drupal admin
UI for content modeling; the frontend reads your display modes through
[the schema system](/explanation/schemas).

## Where to go next

- [Getting started](/tutorials/getting-started): a running site, then
  poke at it.
- [Theme Druxt components](/how-to/theming): the suggestion system in
  practice.
- [Architecture](/explanation/architecture): the full request lifecycle
  in one page.
