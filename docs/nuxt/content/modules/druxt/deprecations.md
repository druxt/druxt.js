---
title: Druxt core deprecations
weight: 10
description: Retired DruxtStore signatures and internal classes, with their replacements.
---

## DruxtStore / addResource - hash

> [druxt] The `hash` argument for `druxt/addResource` has been deprecated.

**Version:** `>= 0.6.0`

Prior to `0.6.0`, DruxtStore used a `hash` argument to separate the filtered resource results:

```js
// Deprecated, hash is no longer required.
this.$store.commit('druxt/addResource', { resource, hash });
```

As of `0.6.0`, the store combines all results into a composite record without the need of the hash:

```js
this.$store.commit('druxt/addResource', { resource });
```

## Internal class and mixins

> [druxt] Use `DruxtModule` instead.

**Deprecated in:** `druxt:0.17.0`
**Removed in:** `druxt:2.0.0`

These were internal building blocks (all marked `@private`) from before
`DruxtModule` became the shared base component. They are superseded by it and
have no generated API page, so they are listed here for anyone who found them
in the source:

| Deprecated            | Replacement   |
| --------------------- | ------------- |
| `DruxtClass`          | `DruxtModule` |
| `DruxtComponentMixin` | `DruxtModule` |

If you extended either directly, extend
[`DruxtModule`](/api/packages/druxt/components/DruxtModule) instead: it
provides the component suggestion system, the wrapper contract, and the
`propsData` / `slots` callbacks described in
[Component resolution](/explanation/component-resolution).

## Where to go next

- [`druxt` module reference](/modules/druxt): options and components.
- [Upgrade Druxt](/how-to/upgrade): the procedure these removals feed into.
