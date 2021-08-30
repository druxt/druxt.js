---
title: Introduction
---

# DruxtEntity

The DruxtEntity module provides a Drupal **Display mode** powered Entity, Form and Field **component system** for your Nuxt.js application.


## Features

- [Nuxt module](#nuxt-module)
- [DruxtEntity component](#druxtentity-component)
- [DruxtEntityForm component](#druxtentityform-component)
- [DruxtField component](#druxtfield-component)
- [DruxtWrapper theming system](#druxtwrapper-theming)
- [DruxtModule settings](#module-settings)
- [DruxtRouter support](#router-support)
- [Auto-generated Nuxt Storybook integration](#storybook)


## Nuxt module

The DruxtEntity module provides Vue.js components and a Nuxt module, among other things.

The Nuxt module installs all required components and dependencies, however most components can be used individually in any Node project.

```js
module.exports = {
  modules: ['druxt-entity'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
}
```

See [Getting started](/guide/getting-started) and the [API documentation](/api) for more details.


## DruxtEntity component

The `DruxtEntity` component fetches the Entity JSON:API resource and schema data to render the Entities fields based on the Drupal Display Mode configuration.

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" mode="displayMode" />
```

![Example DruxtEntity component](../images/druxt-entity.png)

See the [DruxtEntity component API documentation](/api/components/DruxtEntity.html).


## DruxtEntityForm component

The `DruxtEntityForm` component uses Drupal's Form displays modes for content creation and editing.

In addition to rendering the form, the component provides submit and error handling, emitting the relevant data as required.

```vue
<DruxtEntityForm
  :type="resourceType"
  :uuid="uuid"
  mode="displayMode"
  @error="onError()"
  @reset="onReset()"
  @submit="onSubmit()"
/>
```

![Example DruxtEntityForm component](../images/druxt-entity-form.png)

See the [DruxtEntityForm component API documentation](/api/components/DruxtEntityForm.html).


## DruxtField component

The `DruxtField` component is used by the `DruxtEntity` and `DruxtEntityForm` components to render the Field items of a Drupal Entity or form.

The component uses the JSON:API resources attribute data and schema information to determine the appropriate Field component to render the data.

It provides support for basic View and Form fields, and can be extended using the Druxt's Slot and Wrapper theming system.

**Example**

_Using the `<DruxtField />` component to render a `text_default` field._

```vue
<DruxtField
  :schema="{
    id: 'field_disclaimer',
    label: {
      position: 'above',
      text: 'Disclaimer'
    },
    type: 'text_default'
  }"
  :value="{
    format: 'basic_html',
    processed: '<p><strong>Umami Magazine &amp; Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.</p>',
    value: '<strong>Umami Magazine & Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.'
  }"
/>
```

See the [DruxtField API documention](/api/components/DruxtField.html) for more information.


## DruxtWrapper theming

Druxt modules use a slot-based Wrapper component system to provide rich defaults while still allowing full control over all theming and functionality.

See the [theming guide](https://druxtjs.org/guide/theming.html) for more details.


## Module settings

### Reducing Entity data

The default behaviour of the Entity module is to retrieve all available fields from the JSON:API.

This behaviour is configurable using the modules `query` option, allowing for both manually filtered `fields`, automatically filtered fields using the Display mode `schema`, and a combination of the two as required.

The default behaviour can be set via `nuxt.config.js`:
```js
druxt: {
  entity: {
    query: {
      fields: ['path', 'title'],
      schema: true,
    },
  },
}
```

Alternatively, the behaviour can be set directly on an Entity Wrapper component:
```js
druxt: {
  query: {
    fields: ['title'],
    schema: false,
  }
}
```


## Router support

Adds Entity Page support via the [DruxtRouter module](https://router.druxtjs.org) and the [Decoupled Router module](https://www.drupal.org/project/decoupled_router).


## Storybook

DruxtEntity provides zero-config, auto generated Storybook integration with a live data connnection to your Druxt backend.

See [Gettings started](/guide/getting-started) for more information.
