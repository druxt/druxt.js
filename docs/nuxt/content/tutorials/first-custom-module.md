---
title: Building a custom Druxt module
weight: -6
description: Extend DruxtModule to build your own Druxt-powered, themeable component backed by Drupal data.
---

Every Druxt component (entities, views, menus) is built on the same base
class: `DruxtModule`. In this tutorial you'll extend it yourself to build a
`DruxtCustomModule` that:

1. registers as a first-class Druxt module,
2. renders through a **theme component** resolved by Druxt's suggestion
   system, and
3. fetches its own data from Drupal through the **DruxtStore**.

You'll know each step worked because each one has a visible outcome.

## Prerequisites

- You completed [Getting started with Druxt](/tutorials/getting-started)
  and the quickstart is running locally (`npm run dev`).
- At least one Article is published in the backend.
- You're comfortable reading a Vue single-file component.

## Step 1: Scaffold the module and its theme component

Create `nuxt/components/druxt/CustomModule.vue`:

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

What the `druxt()` options mean:

- **`componentOptions`** feeds the component suggestion system with names to
  look for: `[['Default']]` means Druxt will look for a theme component at
  `components/druxt/custom-module/Default.vue` before falling back to its own
  defaults.
- **`propsData`** maps data from the module to props passed to whatever theme
  component is resolved.
- **`slots`** defines the default slot's render function: the actual
  content your module provides.

Then create the theme component it will resolve to,
`nuxt/components/druxt/custom-module/Default.vue`:

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

Finally, use the module on a page. Create `nuxt/pages/custom.vue`:

```vue
<template>
  <Druxt module="custom-module" value="Hello Custom Module" />
</template>
```

**Outcome:** open http://localhost:3000/custom. You see **Hello Custom
Module** in bold. The `<Druxt>` component resolved `module="custom-module"`
to your `DruxtCustomModule` (registered automatically, because the `druxt`
Nuxt module enables component auto-discovery), which rendered through your
`Default.vue` theme component. No manual component registration anywhere.

## Step 2: Change the theme without touching the module

Druxt components delegate their wrapper to the theme layer, and you can
re-wrap them at the point of use. Edit `nuxt/pages/custom.vue`:

```vue
<template>
  <Druxt module="custom-module" value="Hello Custom Module" :wrapper="{ component: 'marquee' }" />
</template>
```

**Outcome:** reload http://localhost:3000/custom. The same bold text now
scrolls across the page. You just changed the rendered markup of a Druxt
component from the outside, without editing the component itself. This
wrapper-resolution mechanism is how whole-site theming works in Druxt; the
[theming guide](/how-to/theming) covers it in depth.

## Step 3: Fetch data from Drupal

So far the module rendered a hard-coded string. Real Druxt modules source
their data from the backend. The `DruxtStore` (the Vuex store that all
Druxt modules share) does the fetching and caching for you.

Update `nuxt/components/druxt/CustomModule.vue`:

```vue
<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue';

export default {
  name: 'DruxtCustomModule',

  extends: DruxtModule,

  data: () => ({
    articles: [],
  }),

  async fetch() {
    const collection = await this.$store.dispatch('druxt/getCollection', {
      type: 'node--article',
    });
    this.articles = collection.data;
    // Overriding fetch() replaces the base hook that resolves the theme
    // component, so invoke it manually. Without this line the druxt block
    // below never runs.
    await DruxtModule.fetch.call(this);
  },

  druxt: {
    componentOptions: () => [['Default']],
    propsData: ({ articles }) => ({ articles }),
    slots(h) {
      return {
        default: (attrs) =>
          h(
            'ul',
            attrs,
            this.articles.map((article) => h('li', [article.attributes.title])),
          ),
      };
    },
  },
};
</script>
```

And edit `nuxt/pages/custom.vue` back to the bare module:

```vue
<template>
  <Druxt module="custom-module" />
</template>
```

**Outcome:** reload http://localhost:3000/custom. Instead of the greeting
you now see a list of article titles, starting with the one you published in
the [Getting started](/tutorials/getting-started) tutorial. Publish another
article in Drupal and reload: it appears too.

What just happened: the module's `fetch()` hook dispatched `getCollection` to
the DruxtStore, which asked your Drupal backend for all `node--article`
resources, cached the result, and handed the data back. The slot render
function turned each resource's `attributes.title` into list items, and the
resolved theme component wrapped them.

## How it works

1. `<Druxt module="custom-module">` resolves to the component named
   `DruxtCustomModule`: Druxt modules are just auto-discovered Vue
   components with a naming convention.
2. The `druxt()` options drive the machinery: suggestions tell Druxt which
   theme components to look for, `propsData` feeds them, `slots` provides
   content.
3. Wrapper components and `props`/`slots`/`$attrs` pass-through mean the
   rendering is yours to override, whether per use, per site, or globally.

The same three ideas power every Druxt module in the
[modules list](/modules).

## Where to go next

- Go deeper on overriding: [Theme Druxt components](/how-to/theming).
- Understand why the suggestion chain looks the way it does:
  [Component resolution](/explanation/component-resolution).
- Read the base class reference:
  [DruxtModule API](/api/packages/druxt/components/DruxtModule).
