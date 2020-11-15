# DruxtJS Breadcrumb

[![CircleCI](https://circleci.com/gh/druxt/druxt-breadcrumb.svg?style=svg)](https://circleci.com/gh/druxt/druxt-breadcrumb)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-breadcrumb/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-breadcrumb?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-breadcrumb/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-breadcrumb)

> Provides a Breadcrumb Vue.js component to be used within a Druxt (DRUpal nuXT) project.

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://breadcrumb.druxtjs.org/
- Community Discord server: https://discord.druxtjs.org

## Install

`$ npm install druxt-breadcrumb`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    'druxt-breadcrumb',
  ],

  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
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
