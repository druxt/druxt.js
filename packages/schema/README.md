# Druxt.js Schema

[![npm](https://badgen.net/npm/v/druxt-schema)](https://www.npmjs.com/package/druxt-schema)
[![CircleCI](https://circleci.com/gh/druxt/druxt-schema.svg?style=svg)](https://circleci.com/gh/druxt/druxt-schema)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-schema/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-schema?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-schema/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-schema)

> Drupal Content Entity schema generator for Druxt with support for View and Form displays.

## Links

- Druxt.js: https://druxtjs.org
- Documentation: https://schema.druxtjs.org/

## Install

`$ npm install druxt-schema`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-schema'
  ],

  druxt: {
    baseUrl: 'https://example.com',
    schema: {
      filter: ['node--.*?--view']
    }
  }
}
```

## Options

### Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
| `endpoint` | `string` | No | `/jsonapi` | JSON:API Endpoint of the Drupal installation. |

### Druxt Schema options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `schema.filter` | `array` | No | `[]` | Array of regular expression rules to filter generated schemas. |
