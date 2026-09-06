---
title: The schema system
weight: -4
description: Drupal display modes become schemas that drive field rendering, generated once at startup and reused to narrow the JSON:API query.
---

After routing resolves _which_ entity to render, the next question is
_which fields, in what order, with what settings_. Druxt's answer is
unusual: it doesn't invent a frontend field configuration, it reads
Drupal's **display modes**. A display mode is Drupal's saved, per-view
configuration of which fields appear, in what order, with which formatter
and settings, managed by site builders in the admin UI.

The `druxt-schema` package turns view modes and form modes into
**schemas**: plain objects describing the fields to render and the
components to render them with.

## An example schema

A schema for an article's `teaser` view mode looks conceptually like:

```js
{
  id: 'node--article--teaser--view',
  resourceType: 'node--article',
  config: { mode: 'teaser', schemaType: 'view' },
  fields: {
    field_image: {
      id: 'field_image',
      type: 'image',          // the Drupal field formatter id
      weight: 0,
      label: { text: 'Image', position: 'hidden' },
      settings: { /* formatter settings */ },
    },
    // ...
  },
}
```

Each field entry has the formatter and its settings from Drupal, in
`weight` order. Entity components turn each field's formatter `type` into a
`DruxtField*` component (an `image` formatter becomes `DruxtFieldImage`),
so the field order and configuration in the schema is what renders on the
page.

## Where schemas come from

`DruxtSchema` reads Drupal's `entity_view_display` and
`entity_form_display` config entities over JSON:API: the same entities
that power Drupal's own **Manage display** screens. A schema is assembled
per combination of entity type, bundle, display mode, and (where relevant)
form or view variant, then cached in its own Vuex store.

A site builder rearranging fields in Drupal changes the decoupled frontend
too, since both read the same source of truth.

## Schemas are generated once, at startup

`druxt-schema` builds every schema during Nuxt's `builder:prepared` hook
(once, when `nuxt dev` or `nuxt build` starts) and writes each one to a
static `schemas/<id>.json` file. At runtime, `$druxtSchema.import(id)` reads
that file. There is no live JSON:API request for schemas after startup.

In practice, this means rearranging fields, changing a formatter, or adding
a new view mode in Drupal **will not appear on the frontend until you
restart `nuxt dev`** (or rebuild). This surprises people because content
changes update live but display-mode changes don't: they run through
entirely different paths.

## Schemas shape the queries, not just the rendering

A less visible role: schemas **narrow the JSON:API query**. Rendering only
needs the fields the display includes, so the fetch can add a
`fields[node--article]=...` filter derived from the schema. Less data
crosses the wire, and because the store distinguishes
[partial from full resources](/explanation/druxt-store), those slim
fetches cache as partial, not as complete resources.

The entity module enables this with:

```js
druxt: {
  entity: {
    query: { schema: true },
  },
},
```

## Field components

Rendering a field means choosing a component for its formatter. The schema
system maps Drupal field formatters to `DruxtField*` components: an image
field with an image formatter becomes `DruxtFieldImage`, a text field with
the default formatter becomes `DruxtFieldTextDefault`, and so on. As with
everything Druxt, the chosen component is then themeable via the
[suggestion system](/explanation/component-resolution): you override the
rendering, not the mapping.

## Why display modes?

The alternative designs all have a known failure mode: a parallel frontend
field configuration drifts from Drupal, or a bespoke "fields in YAML"
format reinvents what site builders already manage. Display modes come with
a UI, per-bundle and per-mode overrides, third-party settings from
contrib, and a decade of Drupal muscle memory. Druxt inherits all of it,
at the cost of depending on display-mode config being present and correct
on the backend.

## Where to go next

- [Component resolution](/explanation/component-resolution): how the
  schema's field components meet your theme components.
- [DruxtSchema API reference](/api/packages/schema).
