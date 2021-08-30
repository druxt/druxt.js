---
title: Modules
---

# Modules

Druxt has a growing list of modules, providing access to different Drupal powered functionality.

- [DruxtBlocks](#druxtblocks)
- [DruxtBreadcrumb](#druxtbreadcrumb)
- [DruxtEntity](#druxtentity)
- [DruxtMenu](#druxtmenu)
- [DruxtRouter](#druxtrouter)
- [DruxtSchema](#druxtschema)
- [DruxtSite](#druxtsite)
- [DruxtViews](#druxtviews)


## DruxtBlocks

The DruxtBlock module adds the ability to render Drupal Blocks and all blocks within a given Block region.

```vue
<DruxtBlock :id="drupal_internal__id" />
```

```vue
<DruxtBlockRegion :name="region" :theme="theme" />
```

![Example DruxtBlockRegion component](/images/druxt-block-region.png)

See [blocks.druxtjs.org](https://blocks.druxtjs.org) for more details.


## DruxtBreadcrumb

The DruxtBreadcrumb module uses hierarchical path data from the DruxtRouter module to render a themable breadcrumb.

```vue
<DruxtBreadcrumb />
```

See [breadcrumb.druxtjs.org](https://breadcrumb.druxtjs.org) for more details.


## DruxtEntity

The DruxtEntity module uses the Drupals Display mode and formatter configuration  to render Entities, Entity forms and fields.

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" mode="displayMode" />
```

![Example DruxtEntity component](/images/druxt-entity.png)

```vue
<DruxtEntityForm :type="resourceType" :uuid="uuid" mode="displayMode" />
```

![Example DruxtEntityForm component](/images/druxt-entity-form.png)

See [entity.druxtjs.org](https://entity.druxtjs.org) for more details.


## DruxtMenu

The DruxtMenu module adds support for full Drupal menus via the Drupal [JSON:API Menu items](https://www.drupal.org/project/jsonapi_menu_items) module.

```vue
<DruxtMenu :name="name" :max-depth="2" />
```

See [menu.druxtjs.org](https://menu.druxtjs.org) for more details.


## DruxtRouter

The DruxtRouter module communicates with the Drupal [Decoupled Router](https://www.drupal.org/project/decoupled_router) module and serves the requested resource components.

See [router.druxtjs.org](https://router.druxtjs.org) for more details.


## DruxtSchema

The DruxtSchema module builds View and Form Field schema files that are used by the DruxtEntity module to render entities using Drupal's Display mode system.

See [schema.druxtjs.org](https://schema.druxtjs.org) for more details.


## DruxtSite

The DruxtJS Site module provides a simple out of the box, decoupled Drupal site experience.

```vue
<DruxtSite :theme="theme" />
```

![Example DruxtSite](/images/druxt-site-umami.png)

See [site.druxtjs.org](https://site.druxtjs.org) for more details.


## DruxtViews

The DruxtViews adds support for Drupal Views via the [JSON:API Views](https://www.drupal.org/project/jsonapi_views).

```vue
<DruxtView :displayId="displayId" :uuid="uuid" :viewId="viewId" />
```

See [views.druxtjs.org](https://views.druxtjs.org) for more details.
