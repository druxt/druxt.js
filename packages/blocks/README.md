<img src="./banner.svg" alt="DruxtBlocks: Drupal blocks and block regions in Nuxt">

# DruxtBlocks

[![npm](https://badgen.net/npm/v/druxt-blocks)](https://www.npmjs.com/package/druxt-blocks)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Render Drupal blocks and block regions in Nuxt with the druxt-blocks components, themed through the Druxt component suggestion system.

DruxtBlocks brings Drupal's block layout to Nuxt. `DruxtBlockRegion` renders
every visible block Drupal places in a theme region, and `DruxtBlock` renders
a single block anywhere in your layout. Both resolve through the Druxt
component suggestion system, so overriding one block's markup takes a single
Vue component.

![Example DruxtBlockRegion component](https://druxtjs.org/images/druxt-block-region.png)

## Features

- Vue.js components:
  - **DruxtBlock**: Render Drupal blocks by UUID or internal ID
  - **DruxtBlockRegion**: Render all blocks within a region
- **Druxt settings**: Filter JSON:API fields
- **@nuxtjs/Storybook** integration

---

## Installation

1. Install the package:

   ```sh
   npm i druxt-blocks
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-blocks'],
   };
   ```

---

## Vue.js components

### DruxtBlock

Renders a Drupal Block by UUID or Drupal's internal ID.

```vue
<DruxtBlock :id="drupal_internal__id" />
```

```vue
<DruxtBlock :uuid="uuid" />
```

- For more details, refer to the [DruxtBlock API documentation](https://druxtjs.org/api/packages/blocks/components/DruxtBlock).

### DruxtBlockRegion

Renders all visible blocks by theme and region name.

```vue
<DruxtBlockRegion :name="name" :theme="theme" />
```

- For more details, refer to the [DruxtBlockRegion API documentation](https://druxtjs.org/api/packages/blocks/components/DruxtBlockRegion).

---

## Settings

### Reducing Block data

The default behaviour of the Block module is to retrieve all available fields from the JSON:API.

This behaviour is configurable using the modules `query` option, allowing for manually filtered `fields`.

The default behaviour can be set via `nuxt.config.js`:

```js
druxt: {
  blocks: {
    query: {
      fields: ['dependencies'],
    },
  },
}
```

---

## Storybook

DruxtBlocks provides zero-config, auto-generated Storybook integration with a live data connection to your Druxt backend.

![DruxtBlocks Storybook integration](https://druxtjs.org/images/druxt-block-storybook.png)

- For more details, see the [Storybook guide](https://druxtjs.org/how-to/storybook).

---

## Options

### DruxtBlock options

These options are specific to this module.

| Option                | Type       | Required | Default | Description                                              |
| --------------------- | ---------- | -------- | ------- | -------------------------------------------------------- |
| `blocks.query.fields` | `string[]` | No       | `[]`    | An array of fields to filter all Block JSON:API queries. |

### Base Druxt options

These options are available to all Druxt modules.

| Option     | Type     | Required | Default    | Description                                                                  |
| ---------- | -------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `axios`    | `object` | No       | `{}`       | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl`  | `string` | Yes      | `null`     | Base URL for the Drupal installation.                                        |
| `endpoint` | `string` | No       | `/jsonapi` | JSON:API Endpoint of the Drupal installation.                                |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/blocks
- Community Discord server: https://discord.druxtjs.org
