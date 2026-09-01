<img src="./banner.svg" alt="DruxtRouter: Drupal routing for Nuxt, via Decoupled Router">

# DruxtRouter

[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Drupal router for Nuxt, powered by the Drupal Decoupled Router module.

DruxtRouter connects Nuxt routing to Drupal routing. A wildcard route catches
requests, resolves them through Drupal's
[Decoupled Router](https://www.drupal.org/project/decoupled_router) with path
aliases and redirects included, and renders the matching Druxt component for
the resolved entity or view. Your Nuxt `pages/` directory keeps working
alongside it, so a custom page can take over any route.

## Features

- Vue.js components:
  - **DruxtRouter**: Renders a Druxt component for the resolved Decoupled route
- Route providers:
  - **Content entity** routes resolve **DruxtEntity** components
  - **Drupal Views** page routes resolve **DruxtView** components

---

## Installation

1. Install the package:

   ```sh
   npm i druxt-router
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-router/nuxt'],
   };
   ```

### Options

- `druxt.router.middleware`

  Type: `boolean`  
  Default: `true`

  Controls whether to execute the Route page middleware and process redirects.

- `druxt.router.pages`

  Type: `boolean`  
  Default: `true` if **pages/** directory exists, else `false`

  Controls whether the Nuxt **pages/** directory is used to generate routes.

- `druxt.router.wildcard`

  Type: `boolean`  
  Default: `true`

  Controls whether the wildcard route should be installed into the Nuxt/Vue router.

---

## Vue.js components

### DruxtRouter

Renders a Druxt module router component based on the resolved route provided by the Drupal Decoupled Router module.

```vue
<DruxtRouter path="/" />
```

If no Path is provided, the component will default to the Vue router fullpath.

- For more details, refer to the [DruxtRouter API documentation](https://druxtjs.org/api/packages/router/components/DruxtRouter).

---

## Deprecations

Retired `DruxtRouter` client pass-through methods and `druxtRouter` store
resource members, with their replacements, are listed on the
[deprecations page](https://druxtjs.org/modules/router/deprecations).

- For the routing API itself, see the
  [DruxtRouter API documentation](https://druxtjs.org/api/packages/router/router).

---

## Options

### Druxt Router options

These options are specific to this module.

| Option            | Type      | Required | Default | Description                                   |
| ----------------- | --------- | -------- | ------- | --------------------------------------------- |
| `router.pages`    | `boolean` | No       | `true`  | Whether to parse the Nuxt `pages/` directory. |
| `router.wildcard` | `boolean` | No       | `true`  | Whether to install the wildcard route.        |

### Base Druxt options

These options are available to all DruxtJS modules.

| Option     | Type     | Required | Default    | Description                                                                  |
| ---------- | -------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `axios`    | `object` | No       | `{}`       | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl`  | `string` | Yes      | `null`     | Base URL for the Drupal installation.                                        |
| `endpoint` | `string` | No       | `/jsonapi` | JSON:API Endpoint of the Drupal installation.                                |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/router
- Community Discord server: https://discord.gg/QnZD46c
