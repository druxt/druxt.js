---
title: Introduction
---

# DruxtJS Site

The DruxtJS Site module provides a simple out of the box, decoupled Drupal site experience.


## How it works

The Druxt Site module provides a Nuxt module and a Vue.js component, which when installed will communicate with a Drupal JSON:API backend to determine what Blocks and what Drupal content to render.

## Features

The following modules are installed and configured by the Site module:

### [druxt](http://druxtjs.org)

  The Druxt module is the core component and theming system for DruxtJS.
  - Adds `Druxt` component.

### [druxt-blocks](https://blocks.druxtjs.org/)

  The Block module adds support to render Blocks, Regions of Blocks and custom content blocks.
  - Adds the `DruxtBlock`, `DruxtBlockRegion` and `DruxtBlockContent` components.

### [druxt-breadcrumb](https://breadcrumb.druxtjs.org/)

  The Breadcrumb module uses hierarchical path data from the Druxt Router module to render a themable breadcrumb.
  - Adds the `DruxtBreadcrumb` component.

### [druxt-entity](https://entity.druxtjs.org/)

  The Entity module uses the Druxt Schema module data to render Entities and Fields in Nuxt using Drupals Display mode and formatter system.
  - Adds the `DruxtEntity` and `DruxtField` components.
  - Adds entity support to DruxtRouter.
  - Adds a collection of Field components.

### [druxt-menu](https://menu.druxtjs.org/)

  The Menu module adds support for full Drupal menus via the Drupal [JSON:API Menu items](https://www.drupal.org/project/jsonapi_menu_items) module.
  - Adds the `DruxtMenu` component.

### [druxt-router](https://router.druxtjs.org/)

  The Router module communicates with the Drupal [Decoupled Router](https://www.drupal.org/project/decoupled_router) module to determine what Druxt component to render the route data.
  - Adds the `DruxtRouter` component.
  - Adds a wildcard DruxtRouter page to the Nuxt router system.

### [druxt-schema](https://schema.druxtjs.org/)

  The Schema module builds View and Form schemas for the required Entity Display modes to be used by the Entity module.

### [druxt-views](https://views.druxtjs.org/)

  The Views module communicates with the Drupal [JSON:API Views](https://www.drupal.org/project/jsonapi_views) module to provide Drupal Views support.
  - Adds the `DruxtView` component.
  - Adds view support to DruxtRouter.
