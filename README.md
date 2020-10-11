# DruxtJS; A bridge between frameworks.

[![CircleCI](https://circleci.com/gh/druxt/druxt.js.svg?style=svg)](https://circleci.com/gh/druxt/druxt.js)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)


> DruxtJS provides an easy connection between a Drupal JSON:API backend and NuxtJS frontend application.


## Links

- Documentation: https://druxtjs.org
- Community Discord server: https://discord.druxtjs.org


## Install

`$ npm install druxt`


## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    'druxt'
  ],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org'
  }
}
```


### The Druxt component

Druxt provides a Vue.js component to easily access Drupal's JSON:API data, with a simple Slot based theming system.

```vue
<Druxt :module="module" :props-data="propsData" :wrapper="wrapper" />
```

Get started with the [Guide](https://druxtjs.org/guide/) and [API Documentation](https://druxtjs.org/api/components/Druxt.html).


## Join the community

DruxtJS is an open source project, built by the comunity for the community.

Find support or get involved in building Druxt via our community channels:

- [DruxtJS Discord server](https://discord.druxtjs.org)
- #druxt Slack channel on [Drupal.org slack](https://drupal.org/slack)


## Decoupled sites

The [DruxtJS Site module](http://site.druxtjs.org/) provides minimal configuration, decoupled Drupal site functionality.
