# DruxtJS; A bridge between frameworks.

[![npm](https://badgen.net/npm/v/druxt)](https://www.npmjs.com/package/druxt)
[![CircleCI](https://circleci.com/gh/druxt/druxt.js.svg?style=svg)](https://circleci.com/gh/druxt/druxt.js)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)


> DruxtJS provides an easy connection between a Drupal JSON:API backend and Nuxt.js frontend application.


## Links

- Documentation: https://druxtjs.org
- Community Discord server: https://discord.druxtjs.org


## Install

`$ npm install druxt`

## Usage

### Drupal JSON:API client

Two methods of communication with the Drupal JSON:API are provided by Druxt, a framework agnostic [**DruxtClient**](https://druxtjs.org/api/client) and the [**DruxtStore**](https://druxtjs.org/api/stores/druxt) Vuex module, which adds an additional cache layer.

**Example:**
```js
const { DruxtClient } = require('druxt')
new DruxtClient('https://demo-api.druxtjs.org')
  .getCollection('node--page')
  .then((res) => {
    // Do the thing!
  })
```

Get started with the [Guide](https://druxtjs.org/guide/) and [API Documentation](https://druxtjs.org/api/client).

### Nuxt Module / Plugin

The Nuxt module adds the Vue components, Vuex store and DruxtClient plugin to your Nuxt application.

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: ['druxt'],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org'
  }
}
```

The `$druxt` plugin gives your Nuxt application access to the `DruxtClient`.

**Example:**

```vue
<script>
export default {
  async fetch() {
    this.page = await this.$druxt.getResource({
      type: 'node--page',
      id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
    })
  },
  data: () => ({ page: null }),
}
</script>
```

## Themable modules

Druxt uses a Module and slot-based Wrapper component system, making it easy to render and theme Drupal data.

Find more details in the [Guide](https://druxtjs.org/guide/)


## Community support

Druxt is an open source project, built by the comunity for the community.

Find support or get involved in building Druxt via the community channels:
- [DruxtJS Discord server](https://discord.druxtjs.org)
- **#druxt** Slack channel on [Drupal.org slack](https://drupal.org/slack)


## Fully decoupled Drupal sites

The [**DruxtSite**](https://site.druxtjs.org) module provides minimal configuration, decoupled Drupal site functionality.

Try out the [Umami demo](https://demo.druxtjs.org), or checkout the source for the [Nuxt.js frontend](https://github.com/druxt/demo.druxtjs.org) and the [Drupal 9 backend](https://github.com/druxt/demo-api.druxtjs.org).
