# Druxt.js Router

[![CircleCI](https://circleci.com/gh/druxt/druxt-router.svg?style=svg)](https://circleci.com/gh/druxt/druxt-router)
[![Known Vulnerabilities](https://snyk.io//test/github/druxt/druxt-router/badge.svg?targetFile=package.json)](https://snyk.io//test/github/druxt/druxt-router?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-router/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-router)

Simple decoupled [Drupal](https://drupal.org) routing for your [Nuxt.js](https://nuxtjs.org) application.

## Links

- Documentation: https://druxt.github.io/druxt-router/

## Features

- Nuxt.js module with out of the box page routing: `druxt-router`
- Vuex store: `druxtRouter`
- Vue component: `<druxt-router />`
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
    baseUrl: 'https://example.com'
  }
}
```

Ensure you have activated the [Nuxt Vuex store](https://nuxtjs.org/guide/vuex-store/).

## Options

### Base Druxt options

These options are available to all Druxt.js modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
| `endpoint` | `string` | No | `/jsonapi` | JSON:API Endpoint of the Drupal installation. |
