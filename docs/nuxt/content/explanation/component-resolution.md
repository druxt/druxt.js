---
title: Component resolution
weight: -3
description: Druxt finds a wrapper component by ranking candidate names from the render context, then hands it the props, slots and attributes it needs.
---

Every Druxt component (entities, fields, menus, views, blocks) delegates
its rendering to a **wrapper component**. The wrapper is found, not
specified: Druxt builds a ranked list of candidate names from the render
context and uses the most specific one that exists in your project. This is
Druxt's theming model, and it's why the framework is unstyled by design:
the styling is _your_ components, discovered by _its_ rules.

## The suggestion chain

A `DruxtEntity` rendering an article in the `teaser` mode generates
candidates in this order (most specific first):

```text
DruxtEntityNodeArticleTeaser
DruxtEntityNodeTeaser
DruxtEntityNodeArticle
DruxtEntityNode
DruxtEntityTeaser
```

Bare `DruxtEntity` is never a candidate. The first candidate that exists
as a component in your project wins; if none match, Druxt falls back to
its own default rendering. Registered means discovered by Nuxt's
auto-import from your `components/` directory, so a saved file is
immediately a candidate. Candidate sets combine any context the module
provides (entity type, bundle, view mode, field name), and, when a
language is in play, a langcode-suffixed variant of every candidate
(`DruxtEntityNodeArticleTeaserEs`) is tried first.

## Where candidates come from

Each module built on the `DruxtModule` base class provides a
`druxt.componentOptions()` callback returning sets of name parts. The base
class turns the parts into PascalCase candidate names, adds language
variants, de-duplicates, and sorts **most-specific first**. The order in
the sorted list is the theme override order: more parts (a more precise
context) beats fewer.

The chain is visible at development time: the resolved options live on the
component's `component.options` data, and the
[Vue Devtools integration](/how-to/devtools) can print a ready-to-edit
skeleton for the component it _would_ have used.

## How wrappers receive data

A resolved wrapper isn't a slot dump: it's a full component with an input
contract:

- **`propsData`**: the module's `druxt.propsData()` callback maps its data
  to props the wrapper declares (an entity wrapper receives `entity`, a
  field wrapper receives the field data and schema settings).
- **Slots**: the module's `druxt.slots()` render functions provide default
  content, which the wrapper places and wraps as it sees fit.
- **`$attrs`**: anything not declared as a prop is passed down, so wrappers
  can pass classes and attributes to their root element.

A minimal wrapper is tiny:

```vue
<!-- components/druxt/entity/node/article/Teaser.vue -->
<template>
  <article class="prose">
    <slot name="field_image" />
    <slot />
  </article>
</template>

<script>
export default {
  props: { entity: { type: Object, default: undefined } },
};
</script>
```

Drop that file in your project and it takes over article teaser rendering
everywhere, with nothing to register and no framework code to copy. The
directory path is what
Nuxt auto-discovery turns into the candidate name
(`druxt/entity/node/article/Teaser.vue` → `DruxtEntityNodeArticleTeaser`);
the `entity` prop and per-field scoped slots (`field_image`, and one per
rendered field) are what the module feeds you.

## Re-wrapping at the point of use

Separately from the suggestion system, any Druxt component accepts a
`wrapper` prop that swaps the element wrapping its output:

```vue
<DruxtEntity type="node--article" :uuid="uuid" :wrapper="{ component: 'b', class: 'title' }" />
```

This composes with the theme layer: the wrapper component is resolved by
suggestions, then wrapped again by whatever you passed.

## Why this design

The common failure it avoids is the fork: a theming system that requires
editing framework components (or copying them) makes upgrades painful and
drift inevitable. Suggestion-based discovery means the framework never
needs to know about your components: it only needs to _name_ what it would
like to see. The cost is indirection: the rendered component isn't visible
at the use site, so the devtools integration and the `component.options`
introspection exist to show you which component was chosen.

## Where to go next

- [Theme Druxt components](/how-to/theming): the practical side.
- [DruxtModule API reference](/api/packages/druxt/components/DruxtModule):
  the base class behind everything described here.
