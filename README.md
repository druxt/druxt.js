# Druxt blocks

[![CircleCI](https://circleci.com/gh/druxt/druxt-blocks.svg?style=svg)](https://circleci.com/gh/druxt/druxt-blocks)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-blocks/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-blocks?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-blocks/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-blocks)

Provides Drupal blocks and region components to be used within a Druxt (DRUpal nuXT) project.

## Install

`$ npm install druxt-blocks`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-blocks',
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
