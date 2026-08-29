---
title: Menu
description: Drupal Menu and Menu item Druxt components, with support for the JSON:API Menu Items module.
---

![Example DruxtMenu component](/images/druxt-menu.png)

## Features

- Vue.js components:
  - **DruxtMenu**: Render Drupal menu by name
- **Druxt settings**: Filter JSON:API fields
- **Drupal Menu blocks**
- **@nuxtjs/Storybook** integration

---

## Installation

1. Download the module:

   ```sh
   npm i druxt-menu
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-menu'],
   };
   ```

---

## Drupal requirements

Rendering a menu needs data from the Drupal side, and where it comes from
depends on what you want:

- **Menu blocks** (the typical site case): rendered by the
  [Blocks module](/modules/blocks): no extra Drupal setup.
- **Full menus by name** (`<DruxtMenu name="main">`): requires the
  [JSON:API Menu Items](https://www.drupal.org/project/jsonapi_menu_items)
  Drupal module:

  ```sh
  composer require drupal/jsonapi_menu_items
  drush pm:enable jsonapi_menu_items
  ```

  Once enabled, Druxt automatically switches to the
  `jsonapi_menu_items` resource for menu fetching (set
  `druxt.menu.jsonApiMenuItems: false` to prevent that). Multilingual
  menus need `jsonapi_menu_items` `1.2.4` or later.

---

## Vue.js Components

### DruxtMenu

Renders a Drupal menu using either the default Drupal content menus, or the full menu via the [JSON:API Menu Items](https://www.drupal.org/project/jsonapi_menu_items) module.

```vue
<DruxtMenu name="main" :depth="1" />
```

- For more details, refer to the [DruxtMenu API documentation](/api/packages/menu/components/DruxtMenu).

---

## Settings

### Reducing JSON:API data

The default behaviour of the Menu module is to retrieve all available fields from the JSON:API.

This behaviour is configurable using the modules `query` option, allowing for manually filtered `fields` or automatically filtered fields using the `requiredOnly` option.

The default behaviour can be set via `nuxt.config.js`:

```js
druxt: {
  menu: {
    query: {
      fields: [],
      requiredOnly: true,
    },
  },
}
```

Alternatively, the behaviour can be set directly on a Menu wrapper component:

```vue
<script>
export default {
  druxt: {
    query: {
      fields: ['description', 'options'],
      requiredOnly: false,
    },
  },
};
</script>
```

---

## Menu blocks

The DruxtMenu module provides a **DruxtBlockSystemMenuBlock** component that is used by the Druxt Block module to render Drupal menu blocks.

- For more details, see the [Druxt Blocks module](/modules/blocks).

---

## Storybook

DruxtMenu provides zero-config, auto-generated Storybook integration with a live data connection to your Druxt backend.

- For more details, see the [Storybook guide](/how-to/storybook).

---

---

## Package README

The full npm package README (features, badges, install) is mirrored as the [generated package README page](/modules/menu/readme).
