# DruxtJS Router

[![CircleCI](https://circleci.com/gh/druxt/druxt-router.svg?style=svg)](https://circleci.com/gh/druxt/druxt-router)
[![Known Vulnerabilities](https://snyk.io//test/github/druxt/druxt-router/badge.svg?targetFile=package.json)](https://snyk.io//test/github/druxt/druxt-router?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-router/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-router)

> Drupal router for Nuxt, powered by the Drupal Decoupled Router module.

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/router
- Community Discord server: https://discord.druxtjs.org

## Features

- Nuxt.js module with out of the box page routing: `druxt-router`
- Vuex store: `druxtRouter`
- Vue component: `<DruxtRouter />`
- Vue mixin: `DruxtRouterEntityMixin`

## Install

`$ npm install druxt-router`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-router'
  ],

  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org'
  }
}
```

Ensure you have activated the [Nuxt Vuex store](https://nuxtjs.org/guide/vuex-store/).

## Options

### Druxt Router options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `router.pages` | `boolean` | No | `true` | Whether to parse the Nuxt `pages/` directory. |
| `router.wildcard` | `boolean` | No | `true` | Whether to install the wildcard route. |

### Base Druxt options

These options are available to all DruxtJS modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
| `endpoint` | `string` | No | `/jsonapi` | JSON:API Endpoint of the Drupal installation. |
