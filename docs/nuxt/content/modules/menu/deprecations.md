---
title: Deprecations
weight: 10
description: The retired DruxtMenu items computed property, and what replaces it.
---

# Deprecations

## DruxtMenu / items computed

> [druxt-menu] The `items` computed property is deprecated.

**Deprecated in:** `druxt-menu:0.11.0`
**Removed in:** `druxt-menu:2.0.0`

`0.11.0` added `v-model` support to `DruxtMenu`. The processed menu items
moved to the standard `model` property, and the `items` computed stayed
behind as a pass-through:

```js
items: ({ model }) => model,
```

### What replaces it

Read `model` instead of `items` when you access the component instance
directly, through a template ref or in a component that extends `DruxtMenu`:

```js
// Deprecated.
const items = this.$refs.menu.items;

// Use the model.
const items = this.$refs.menu.model;
```

### What is not affected

Only the computed property on the component is deprecated. **Wrapper
components and scoped slots are unchanged**, and still receive a prop named
`items`, which `DruxtMenu` populates from `model`:

```js
propsData: ({ model, parentId }) => ({ items: model, parentId, value: model }),
```

So this keeps working, and doesn't need changing:

```vue
<DruxtMenu>
  <template #default="{ items }">
    <MyMenu :items="items" />
  </template>
</DruxtMenu>
```

## Where to go next

- [`druxt-menu` module reference](/modules/menu): options and components.
- [Component resolution](/explanation/component-resolution): how menu wrapper
  components are discovered.
