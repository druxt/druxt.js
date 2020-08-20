# \<druxt-views />

[![CircleCI](https://circleci.com/gh/druxt/druxt-views.svg?style=svg)](https://circleci.com/gh/druxt/druxt-views)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-views/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-views?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-views/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-views)

Provides Drupal Views integration within a Druxt (DRUpal nuXT) project.

## Install

`$ npm install druxt-views`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-router',
    'druxt-views'
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
