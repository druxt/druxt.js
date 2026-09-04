<img src="./banner.svg" alt="DruxtBreadcrumb: breadcrumb trails from the Drupal decoupled router">

# DruxtBreadcrumb

[![npm](https://badgen.net/npm/v/druxt-breadcrumb)](https://www.npmjs.com/package/druxt-breadcrumb)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Render a breadcrumb trail in Nuxt from the Drupal decoupled router, with the DruxtBreadcrumb component and its theming options.

DruxtBreadcrumb builds a breadcrumb trail for the current route. It walks the
route's parent paths through the decoupled router, so the trail follows your
Drupal path hierarchy with no manual configuration, and it themes like every
other Druxt component.

![Example DruxtBreadcrumb component](https://druxtjs.org/images/druxt-breadcrumb.png)

## Features

- Vue.js components:
  - **DruxtBreadcrumb**: Render Drupal breadcrumbs by route

---

## Installation

1. Install the package:

   ```sh
   npm i druxt-breadcrumb
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-breadcrumb'],
   };
   ```

---

## Vue.js components

### DruxtBreadcrumb

Renders a list of breadcrumbs based on the active route.

```vue
<DruxtBreadcrumb />
```

- For more details, refer to the [DruxtBreadcrumb API documentation](https://druxtjs.org/api/packages/breadcrumb/components/DruxtBreadcrumb).

---

## Options

### Base Druxt options

These options are available to all Druxt modules, in the `nuxt.config.js` file.

| Option          | Type     | Required | Default | Description                                                                  |
| --------------- | -------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `druxt.axios`   | `object` | No       | `{}`    | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `druxt.baseUrl` | `string` | Yes      | `null`  | Base URL for the Drupal installation.                                        |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/breadcrumb
- Community Discord server: https://discord.druxtjs.org
