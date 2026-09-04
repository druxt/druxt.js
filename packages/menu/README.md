<img src="./banner.svg" alt="DruxtMenu: Drupal menus as Vue components">

# DruxtMenu

[![npm](https://badgen.net/npm/v/druxt-menu)](https://www.npmjs.com/package/druxt-menu)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Drupal Menu and Menu item Druxt components, with support for the JSON:API Menu Items module.

DruxtMenu renders Drupal menus in Nuxt. Ask for a menu by name and you get
the tree Drupal manages; with the JSON:API Menu Items module it covers full
menus, including module-defined links, not just content links. Every menu and
menu item themes through the Druxt component suggestion system.

![Example DruxtMenu component](https://druxtjs.org/images/druxt-menu.png)

## Features

- Vue.js components:
  - **DruxtMenu**: Render Drupal menu by name
- **Druxt settings**: Filter JSON:API fields
- **Drupal Menu blocks**
- **@nuxtjs/Storybook** integration

---

## Installation

> Included with [`druxt-site`](https://druxtjs.org/modules/site); install separately only when composing modules yourself.

1. Install the package:

   ```sh
   npm i druxt-menu
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-menu'],
     druxt: {
       baseUrl: 'https://demo-api.druxtjs.org',
     },
   };
   ```

   `druxt.baseUrl` is required: without it the generated plugin throws
   `The 'baseUrl' parameter is required.`

---

## Drupal requirements

Rendering a menu needs data from the Drupal side, and where it comes from
depends on what you want:

- **Menu blocks** (the typical site case): rendered by the
  [Blocks module](https://druxtjs.org/modules/blocks): no extra Drupal setup.
- **Full menus by name** (`<DruxtMenu name="main">`): requires the
  [JSON:API Menu Items](https://www.drupal.org/project/jsonapi_menu_items)
  Drupal module:

  ```sh
  composer require drupal/jsonapi_menu_items
  drush pm:enable jsonapi_menu_items
  ```

  Once enabled, set `druxt.menu.jsonApiMenuItems: true` to fetch menus
  through the `jsonapi_menu_items` resource; without it Druxt keeps using
  `menu_link_content`. Multilingual menus need `jsonapi_menu_items`
  `1.2.4` or later.

---

## Vue.js Components

### DruxtMenu

Renders a Drupal menu using either the default Drupal content menus, or the full menu via the [JSON:API Menu Items](https://www.drupal.org/project/jsonapi_menu_items) module.

```vue
<DruxtMenu name="main" :depth="1" />
```

- For more details, refer to the [DruxtMenu API documentation](https://druxtjs.org/api/packages/menu/components/DruxtMenu).

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

- For more details, see the [Druxt Blocks module](https://druxtjs.org/modules/blocks).

---

## Storybook

DruxtMenu provides zero-config, auto-generated Storybook integration with a live data connection to your Druxt backend.

- For more details, see the [Storybook guide](https://druxtjs.org/how-to/storybook).

---

## Deprecations

The `items` computed property is deprecated in favour of `model`. See the
[deprecations page](https://druxtjs.org/modules/menu/deprecations) for what replaces it, and what
is unaffected.

---

## Options

### Druxt Menu options

These options are specific to this module.

| Option                    | Type       | Required | Default | Description                                                                                                                                                                                                   |
| ------------------------- | ---------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `menu.jsonApiMenuItems`   | `boolean`  | No       | `true`  | Use the Drupal [JSON:API Menu Items](https://www.drupal.org/project/jsonapi_menu_items) module resource. The Nuxt module enables this by default; the `DruxtMenu` class used directly defaults it to `false`. |
| `menu.query.fields`       | `string[]` | No       | `false` | An array of fields to filter all JSON:API Menu queries.                                                                                                                                                       |
| `menu.query.requiredOnly` | `boolean`  | No       | `false` | Whether to automatically filter to module-defined minimum required fields.                                                                                                                                    |

### Base Druxt options

These options are available to all Druxt modules.

| Option     | Type     | Required | Default    | Description                                                                  |
| ---------- | -------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `axios`    | `object` | No       | `{}`       | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl`  | `string` | Yes      | `null`     | Base URL for the Drupal installation.                                        |
| `endpoint` | `string` | No       | `/jsonapi` | JSON:API Endpoint of the Drupal installation.                                |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/menu
- Community Discord server: https://discord.druxtjs.org
