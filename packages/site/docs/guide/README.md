---
title: Introduction
---

# DruxtSite

The DruxtJS Site module provides a simple out of the box, decoupled Drupal site experience.


## Features

- [Nuxt module](#nuxt-module)
- [Router](#router)
- [Blocks and regions](#blocks-and-regions)
- [Entities and fields](#entities-and-fields)
- [Views](#views)
- [Menus](#menus)

## Nuxt module

The DruxtSite module provides a Vue.js component and a Nuxt module, among other things.

The Nuxt module installs all required components and dependencies.

```js
module.exports = {
  modules: ['druxt-site'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
}
```

See [Getting started](/guide/getting-started) and the [API documentation](/api) for more details.


## Router

The DruxtRouter module communicates with the Drupal [Decoupled Router](https://www.drupal.org/project/decoupled_router) module and serves the requested resource components.

### Aliases and redirects

### Node and content entity routes

### View pages

See [router.druxtjs.org](https://router.druxtjs.org) for more details.


## Blocks and regions

The DruxtBlock module adds the ability to render Drupal Blocks and all blocks within a given Block region.

### Automatic blocks by route visibility

Block regions and visible blocks are rendered automatically when using the **DruxtSite** component.

Block placement is managed in the Drupal backend, in the relevant **theme**.

```vue
<DruxtSite :theme="theme" />
```

### Block component

```vue
<DruxtBlock :uuid="uuid" />
```

### Block region component

```vue
<DruxtBlockRegion :name="region" :theme="theme" />
```

See [blocks.druxtjs.org](https://blocks.druxtjs.org) for more details.


## Entities and fields

The DruxtEntity module uses the Drupals Display mode and formatter configuration  to render Entities, Entity forms and fields.

### Content display with Entity component

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" mode="displayMode" />
```

![Example DruxtEntity component](../images/druxt-entity.png)

### Content editing with Entity form component

```vue
<DruxtEntityForm :type="resourceType" :uuid="uuid" mode="displayMode" />
```

![Example DruxtEntityForm component](../images/druxt-entity-form.png)

See [entity.druxtjs.org](https://entity.druxtjs.org) for more details.


## Views

The DruxtViews adds support for Drupal Views via the [JSON:API Views](https://www.drupal.org/project/jsonapi_views).

### View component

```vue
<DruxtView :displayId="displayId" :uuid="uuid" :viewId="viewId" />
```

### View pages and blocks

Support for View pages is added via the DruxtRouter module, and blocks via the DruxtBlocks module.

### Filters, Sorts and pagination

Views support exposed filters and sorting, as well as pagination, with configuration provided via the Drupal backend.

See [views.druxtjs.org](https://views.druxtjs.org) for more details.


## Menus

The DruxtMenu module adds support for full Drupal menus via the Drupal [JSON:API Menu items](https://www.drupal.org/project/jsonapi_menu_items) module.

### Menu component

```vue
<DruxtMenu :name="name" :max-depth="2" />
```

See [menu.druxtjs.org](https://menu.druxtjs.org) for more details.


## Breadcrumb

The DruxtBreadcrumb module uses hierarchical path data from the DruxtRouter module to render a themable breadcrumb.

```vue
<DruxtBreadcrumb />
```

See [breadcrumb.druxtjs.org](https://breadcrumb.druxtjs.org) for more details.
