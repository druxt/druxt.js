<img src="./banner.svg" alt="DruxtSite: a decoupled Drupal site out of the box">

# DruxtSite

[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)
[![npm](https://badgen.net/npm/v/druxt-site)](https://www.npmjs.com/package/druxt-site)

> Out-of-the-box decoupled Drupal sites with DruxtSite, wiring layout, blocks, menus and content together from one Nuxt module.

DruxtSite is the whole framework in one module. Install it and you get
routing, entities, blocks, menus, views and breadcrumbs preconfigured: the
`DruxtSite` component renders your Drupal theme's regions and content using
Drupal's own display configuration. Start here if you want a decoupled Drupal
site rather than individual building blocks.

![Drupal Umami Parity demo](https://druxtjs.org/images/umami.png)

## Features

- **Router** with path alias and redirect support for Entity and Views pages.
- **Vuex** based, on-demand JSON:API resource loading.
- **Entity / Field** render system powered by Drupal display modes.
- **Block** region and **Content block** component rendering.
- **Views** and **Views blocks** via the [Drupal JSON:API Views module](https://www.drupal.org/project/jsonapi_views).
- **Breadcrumb**, **Menus** and more.
- **File Proxy** enabled by default, and support for API proxying.

---

## Installation

1. Install the package:

   ```sh
   npm i druxt-site
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-site'],
   };
   ```

### Options

- `druxt.site.layout`

  Type: `boolean`  
  Default: `true`

  Adds a default layout if no default layout has been provided.

- `druxt.site.theme`

  Type: `string`

  Sets the default theme to be used by the DruxtSite component. Theme can be overridden by the `theme` property on the component.  
  If no value is provided, a fallback value will be determined from the JSON:API.

---

## Vue.js components

### DruxtSite

Renders all available block regions based on the specified theme.

```vue
<DruxtSite :theme="theme" />
```

- For more details, refer to the [DruxtSite API documentation](https://druxtjs.org/api/packages/site/components/DruxtSite).

---

## Options

### Base Druxt options

These options are available to all Druxt modules.

| Option     | Type     | Required | Default    | Description                                                                  |
| ---------- | -------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `axios`    | `object` | No       | `{}`       | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl`  | `string` | Yes      | `null`     | Base URL for the Drupal installation.                                        |
| `endpoint` | `string` | No       | `/jsonapi` | JSON:API Endpoint of the Drupal installation.                                |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/site
- Community Discord server: https://discord.gg/QnZD46c
