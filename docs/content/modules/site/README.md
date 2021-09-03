---
title: Site
description: Out of the box Decoupled Drupal sites with Druxt.
---

![Drupal Umami Parity demo](/images/umami.png)

Using Drupal's built in Entity display modes and Field formatter system, Views, Blocks and more, the Druxt Site module provides the out of the box experience you expect.


## Features

- **Router** with path alias and redirect support for Entity and Views pages.
- **Vuex** based, on-demand JSON:API resource loading.
- **Entity / Field** render system powered by Drupal display modes.
- **Block** region and **Content block** component rendering.
- **Views** and **Views blocks** via the [Drupal JSON:API Views module](https://www.drupal.org/project/jsonapi_views).
- **Breadcrumb**, **Menus** and more.

* * *

## Installation

1. Download the module:
   ```sh
   npm i druxt-site
   ```

2. Add the module to `nuxt.config.js`:
   ```js
   export default {
     modules: ['druxt-site'],
   }
   ```

* * *

## Vue.js components

### DruxtSite

Renders all available block regions based on the specified theme.

```vue
<DruxtSite :theme="theme" />
```

- For more details, refer to the [DruxtSite API documentation](/api/packages/site/components/DruxtSite).
