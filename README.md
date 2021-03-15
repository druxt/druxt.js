# DruxtJS Entity

[![CircleCI](https://circleci.com/gh/druxt/druxt-entity.svg?style=svg)](https://circleci.com/gh/druxt/druxt-entity)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-entity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-entity?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-entity/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-entity)

> The DruxtJS Entity module provides a Drupal Display Mode powered Entity and Field component system for your Nuxt.js frontend.

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://entity.druxtjs.org
- Community Discord server: https://discord.druxtjs.org

## Install

`$ npm install druxt-entity`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    'druxt-entity',
  ],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
    entity: {
      schema: true,
      fields: ['path', 'title']
    }
  }
}
```

## Options

### Druxt Entity options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `entity.query.fields` | `string[]` | No | `[]` | An array of fields to filter all Entity JSON:API queries. |
| `entity.query.schema` | `boolean` | No | `false` | Whether to automatically filter fields based on Display schema. |

### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
