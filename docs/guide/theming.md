---
title: Theming
---

# Theming

Druxt modules use a slot-based Wrapper component system to provide rich defaults while still allowing full control over all theming and functionality.

- [DruxtWrapper](#druxtwrapper)
- [Default template](#default-template)


## DruxtWrapper

Druxt modules use a DruxtWrapper component system to render a Vue component with fetched data, slots, props and $attrs to be used for theming.

The specific component the rendered is determined by building a list of available component options, using props and data provided to the module, and using the first registered option.

e.g., A DruxtEntity component might render a `DruxtEntityNodeArticleDefault.vue` wrapper component.

Component options can be seen on the `component.options` property of the Druxt module component.

If there are no matching component names, a default `DruxtWrapper` component will be used to render the default output of the module.

See the [DruxtModule API documentation](/api/components/DruxtModule).


```vue
<Druxt
  module="entity"
  :props-data="{ type: 'node--article', uuid }"
/>
```

```vue
<!-- ~/components/druxt/entity/node/article/Default.vue -->
<template>
  <div>
    <h1>{{ $attrs.entity.attributes.title }}</h1>

    <slot />
  </div>
</template>
```


## Default template

Most Druxt modules can have the default template overridden, allowing for full control of the default slot rendering.

The available data provided to the template scope is deteremined by the relevant module.

```vue
<DruxtEntity>
  <template #default="{ entity }">
    <div>
      <h1>{{ entity.attributes.title }}</h1>
    </div>
  </template>
</DruxtEntity>
```
