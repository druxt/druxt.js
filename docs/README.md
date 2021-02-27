---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
features:
- title: Simplicity first
  details: Using minimal configuration, DruxtJS Site uses Drupal's JSON:API data to drive a Vue.js powered decoupled site.
- title: NuxtJS in the front
  details: Nuxt is based on a powerful modular architecture. You don't have to reinvent the wheel to get PWA benefits.
- title: Drupal in the back
  details: Leverage an API-first architecture, robust configuration management, and unparalleled extensibility to build the web of the future.
---

> DruxtJS Site gives you a simple, out of the box, decoupled Drupal site experience with the power of Vue and Nuxt.

Using Drupal's built in Entity display modes and Field formatter system, Views, Blocks and more, DruxtJS Site provides the out of the box experience you expect.

## The DruxtSite component

Druxt Site provides a Vue.js component to render a Drupal Site.

```vue
<DruxtSite :theme="theme" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtSite.html).


### Druxt component

The DruxtSite component is compatible with the DruxtJS component theming system:

```vue
<Druxt module="site" :theme="theme" :wrapper="wrapper">
```

See the [Druxt component documentation](https://druxtjs.org/guide/#the-druxt-component) for more information.


## Features

- **Router** with path alias and redirect support for Entity and Views pages.
- **Vuex** based, on-demand JSON:API resource loading.
- **Entity / Field** render system powered by Drupal display modes.
- **Block** region and **Content block** component rendering.
- **Views** and **Views blocks** via the [Drupal JSON:API Views module](https://www.drupal.org/project/jsonapi_views).
- **Breadcrumb**, **Menus** and more.
