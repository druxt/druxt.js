# Druxt.js - The Drupal powered Nuxt framework.

[![CircleCI](https://circleci.com/gh/druxt/druxt.js.svg?style=svg)](https://circleci.com/gh/druxt/druxt.js)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)


> Druxt.js connects your Drupal backend to your Nuxt.js frontend through the power of Drupal's JSON API.

## Features

- Drupal path alias and redirect compatible router.
- Entity / Field render system powered by Drupal display modes.
- Block render system with support for regions and custom content blocks.
- Views and Views blocks.
- On-demand JSON API resource engine with Vuex.
- Breadrumbs, Menus, Search API and more.

## Install

`$ npm install druxt`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt'
  ],

  druxt: {
    baseUrl: 'https://example.com'
  }
}
```

## Options

### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
| `endpoint` | `string` | No | `/jsonapi` | JSON:API Endpoint of the Drupal installation. |
