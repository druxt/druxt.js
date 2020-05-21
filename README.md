# \<druxt-entity />

[![CircleCI](https://circleci.com/gh/Realityloop/druxt-entity.svg?style=svg)](https://circleci.com/gh/Realityloop/druxt-entity)
[![Known Vulnerabilities](https://snyk.io/test/github/Realityloop/druxt-entity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Realityloop/druxt-entity?targetFile=package.json)
[![codecov](https://codecov.io/gh/Realityloop/druxt-entity/branch/develop/graph/badge.svg)](https://codecov.io/gh/Realityloop/druxt-entity)

Provides an Entity render Vue component to be used within a Druxt (DRUpal nuXT) project.

## Install

`$ npm install druxt-entity`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    ...
    'druxt-entity',
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
