---
title: Introduction
---

# DruxtJS Entity

The DruxtJS Entity module provides a Drupal **Display mode** powered Entity and Field **component system** for your NuxtJS frontend.



## How it works?

Upon installation, the module will automatically register the DruxtJS Entity and Field components, making them available to the Nuxt frontend.

The components use data from a Drupal JSON:API backend, via the DruxtJS [Router](https://druxt.github.io/druxt-router) and [Schema](https://druxt.github.io/druxt-schema) modules, to render Entities and Fields powered by Drupal's Display Mode system.


## Entity component

The Entity component uses JSON:API resource and schema data to render the Entities fields based on the Drupal Display Mode configuration.

**Example**

_Using the `<DruxtEntity />` component to render a `node--article` resource with the `defualt` Display mode._

```vue
<DruxtEntity
  type="node--article"
  uuid="3b0cb75f-385b-446e-a4c6-a30208725ce1"
  mode="default"
/>
```

See the [DruxtEntity API documention](/api/components/DruxtField) for more information.


## Field components

The `<DruxtField />` component is used by the `<DruxtEntity>` field to render the Field items of a Drupal Entity.

The component uses the JSON:API resources attribute data and schema information to determine the appropriate Field component to render the data.

**Example**

_Using the `<DruxtField />` component to render a `text_default` field._

```vue
<DruxtField
  :data="{
    format: 'basic_html',
    processed: '<p><strong>Umami Magazine &amp; Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.</p>',
    value: '<strong>Umami Magazine & Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.'
  }"
  :schema="{
    id: 'field_disclaimer',
    label: {
      position: 'above',
      text: 'Disclaimer'
    },
    type: 'text_default'
  }"
/>
```

See the [DruxtField API documention](/api/components/DruxtField) for more information.


## Custom component suggestions

Both the Entity and Field components use a **Component Suggestion** system to allow for custom components to be used.

This allows for Entity Type component wrappers, custom Field components and more.

See the [DruxtEntityComponentSuggestionMixin API documentation](../api/mixins/componentSuggestion) for more information.
