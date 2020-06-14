# \<druxt-menu />

[![CircleCI](https://circleci.com/gh/Realityloop/druxt-menu.svg?style=svg)](https://circleci.com/gh/Realityloop/druxt-menu)
[![Known Vulnerabilities](https://snyk.io/test/github/Realityloop/druxt-menu/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Realityloop/druxt-menu?targetFile=package.json)
[![codecov](https://codecov.io/gh/Realityloop/druxt-menu/branch/develop/graph/badge.svg)](https://codecov.io/gh/Realityloop/druxt-menu)

Provides a Menu Vue component to be used within a Druxt (DRUpal nuXT) project.

## Install

`$ npm install druxt-menu`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-menu',
    'druxt-router'
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
