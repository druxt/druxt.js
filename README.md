# DruxtJS; A bridge between framekworks.

[![CircleCI](https://circleci.com/gh/druxt/druxt.js.svg?style=svg)](https://circleci.com/gh/druxt/druxt.js)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)


> DruxtJS connects your Drupal backend to your NuxtJS frontend through the power of Drupal's JSON:API.



## Install

`$ npm install druxt`

## Usage

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    'druxt'
  ],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org'
  }
}
```

## Decoupled Site

For an out of the box, decoupled Drupal site, see the [DruxtJS Site module](http://site.druxtjs.org/).

## Options

### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
| `endpoint` | `string` | No | `/jsonapi` | JSON:API Endpoint of the Drupal installation. |
