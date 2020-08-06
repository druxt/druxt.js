---
title: Introduction
---

# Druxt.js Router

The Druxt.js Router module uses the Drupal [Decoupled Router](https://www.drupal.org/project/decoupled_router) module to provide a simple Drupal powered router to your Nuxt.js frontend.


## How it works?

Upon installation, the module will automatically extend the Vue router, adding a wildcard router page.

When accessed, the wildcard router will use the Nuxt.js route and Decoupled router to resolve a JSON:API resource and/or redirect.

Once resolved, the wilcard router page will render a component with relevant routing information.

The rendered component is deteremined by the module configruation and data returned from the Decoupled router.

```vue
<druxt-router />
```
