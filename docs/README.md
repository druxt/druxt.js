---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
features:
- title: Simplicity first
  details: The Druxt component connects Nuxt.js to your Drupal JSON:API.
- title: Community built
  details: Built by the community, for the community.
- title: Decoupled Drupal sites
  details: The Site module brings decoupled Vue.js theming system to Drupal.
---

> DruxtJS provides an easy connection between a Drupal JSON:API backend and Nuxt.js frontend application.

## DruxtClient

The DruxtClient is the communication layer between Nuxt and the Drupal JSON:API.

**Example:**
```js
const { DruxtClient } = require('druxt')

const druxt = new DruxtClient('https://demo-api.druxtjs.org')

druxt.getCollection('node--page').then((res) => {
  ...
})
```

Get started with the [Guide](guide/) and [API Documentation](/api/client).

## The Druxt component

Druxt provides a Vue.js component to easily access Drupal's JSON:API data, with a simple Slot based theming system.

```vue
<Druxt :module="module" :props-data="propsData" :wrapper="wrapper" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/Druxt.html).


## Join the community

DruxtJS is an open source project, built by the comunity for the community.

Find support or get involved in building Druxt via our community channels:

- [DruxtJS Discord server](https://discord.druxtjs.org)
- #druxt Slack channel on [Drupal.org slack](https://drupal.org/slack)


## Site Module / Drupal Umami Parity project

The DruxtJS Site module provides minimal configuration, decoupled Drupal site functionality.

Take a look at the [Umami Parity project demo](https://demo.druxtjs.org), or checkout source for the [Nuxt.js frontend](https://github.com/druxt/demo.druxtjs.org) and the [Drupal 9 backend](https://github.com/druxt/demo-api.druxtjs.org).

![Drupal Umami Parity demo](./images/umami.png)

Get involved at the [Umami Parity project board](https://github.com/orgs/druxt/projects/6) or try out the [DruxtJS Site](https://site.druxtjs.org) module.
