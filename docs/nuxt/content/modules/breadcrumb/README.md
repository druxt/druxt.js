---
title: Breadcrumb
description: Render a breadcrumb trail in Nuxt from the Drupal decoupled router, with the DruxtBreadcrumb component and its theming options.
---

![Example DruxtBreadcrumb component](/images/druxt-breadcrumb.png)

## Features

- Vue.js components:
  - **DruxtBreadcrumb**: Render Drupal breadcrumbs by route

---

## Installation

1. Download the module:

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

- For more details, refer to the [DruxtBreadcrumb API documentation](/api/packages/breadcrumb/components/DruxtBreadcrumb).

---

---

## Package README

The full npm package README (features, badges, install) is mirrored as the [generated package README page](/modules/breadcrumb/readme).
