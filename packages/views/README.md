# DruxtViews

[![npm](https://badgen.net/npm/v/druxt-views)](https://www.npmjs.com/package/druxt-views)
[![CircleCI](https://circleci.com/gh/druxt/druxt-views.svg?style=svg)](https://circleci.com/gh/druxt/druxt-views)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-views/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-views?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-views/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-views)

> The DruxtViews module adds [Drupal](https://drupal.org) Views support to your [Nuxt.js](https://nuxtjs.org) frontend.

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://views.druxtjs.org
- Community Discord server: https://discord.druxtjs.org

## Install

`$ npm install druxt-views`

### Nuxt.js

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: [
    'druxt-views'
  ],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
    views: {
      bundleFilter: true,
      fields: ['title'],
    },
  },
}
```

## Usage

### DruxtView component

The DruxtView component uses the [JSON:API Views module](https://drupal.org/project/jsonapi_views) to render a Decoupled Drupal View.

```vue
<DruxtView view-id="frontpage" />
```

The View can be themed by providing a default scoped slot:
```vue
<DruxtView view-id="frontpage">
  <template #default="{ results }">
    {{ results }}
  </template>
</DruxtView>
```

The component also provides a DruxtWrapper component for theming:
```vue
<template>
  <div>
    <slot name="sorts" />
    <slot name="results" />
    <slot name="pager" />
  <div>
</template>
```

See the [DruxtViews API documentation](https://views.druxtjs.org/api/components/DruxtViews.html) for more information.

## Options

### Druxt Views options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `views.query.bundleFilter` | `boolean` | No | `false` | Whether to automatically detect Resource types to filter, based on the View `bundle` filter. |
| `views.query.fields` | `string[]` | No | `[]` | An array of fields to filter from the JSON:API Views Resource types. |
| `views.query.resourceTypes` | `string[]` | No | `[]` | An array of Resource types to be used by the Fields filter. |

### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
