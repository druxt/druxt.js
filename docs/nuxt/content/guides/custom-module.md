---
title: Building a Custom Druxt Module
description: Learn how to extend DruxtModule to create your own Druxt-powered components.
---

# Building a Custom Druxt Module

The `DruxtModule` base class provides the core functionality for all Druxt components. Extending it lets you build custom Druxt-powered components with full support for the component suggestion system. Theme components and JSON:API data fetching both work exactly like they do for any built-in Druxt component.

## Prerequisites

- A Druxt-enabled Drupal backend
- A Nuxt 2 project with the `druxt` module installed

## Step 1: Create the module component

Create a component that extends `DruxtModule` and defines a `druxt()` options object:

```vue
<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue';

export default {
  name: 'DruxtCustomModule',

  extends: DruxtModule,

  druxt: {
    componentOptions: () => [['Default']],
    propsData: ({ model }) => ({ value: model }),
    slots(h) {
      return {
        default: (attrs) => h('div', { attrs }, [this.model]),
      };
    },
  },
};
</script>
```

The `druxt()` method returns an object with:

- **`componentOptions`**: Returns arrays of component names for the suggestion system. `[['Default']]` means it will look for `components/druxt/custom-module/Default.vue`.
- **`propsData`**: Maps data to props passed to the theme component.
- **`slots`**: Defines the function used to render the default slot.

## Step 2: Create a theme component

Create `components/druxt/custom-module/Default.vue`:

```vue
<template>
  <strong>
    <slot />
  </strong>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  data: ({ value }) => ({ model: value }),
};
</script>
```

## Step 3: Register and use the module

In your `nuxt.config.js`, register the `druxt` module:

```js
export default {
  modules: [['druxt', { baseUrl: 'http://your-drupal-site.example.com' }]],
};
```

Then use your custom module in any page:

```vue
<template>
  <div>
    <Druxt module="custom-module" :wrapper="{ component: 'marquee' }" v-model="model" />

    <input v-model="model" />
  </div>
</template>

<script>
export default {
  data: () => ({
    model: 'Hello Custom Module',
  }),
};
</script>
```

## How it works

1. The `<Druxt>` component loads your `DruxtCustomModule` by matching the `module` prop to the registered module name.
2. The `druxt()` options define how theme components are suggested, what props they receive, and how slots are rendered.
3. The `v-model` binding flows through `propsData` to the theme component and back via events.
