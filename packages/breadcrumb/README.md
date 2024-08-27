# DruxtBreadcrumb

[![npm](https://badgen.net/npm/v/druxt-breadcrumb)](https://www.npmjs.com/package/druxt-breadcrumb)
[![CircleCI](https://circleci.com/gh/druxt/druxt-breadcrumb.svg?style=svg)](https://circleci.com/gh/druxt/druxt-breadcrumb)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-breadcrumb/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-breadcrumb?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-breadcrumb/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-breadcrumb)

> Decoupled Router based Breadcrumb Druxt component.

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/breadcrumb
- Community Discord server: https://discord.druxtjs.org

## Install

`$ npm install druxt-breadcrumb`

### Nuxt.js

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: ['druxt-breadcrumb/nuxt'],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
  },
}
```

## Usage

### DruxtBreadcrumb component

The DruxtBreadcrumb component uses the Vue Router and DruxtRouter to build a list of crumbs.

```vue
<DruxtBreadcrumb />
```

The crumbs can be themed by providing a default scoped slot:
```vue
<DruxtBreadcrumb>
  <template #default="{ crumbs }">
    {{ crumbs }}
  </template>
</DruxtBreadcrumb>
```

The DruxtBreadcrumb also provide a DruxtWrapper component for theming:
```vue
<!-- DruxtBreadcrumbDefault.vue -->
<template>
  <div>
    <slot />
  <div>
</template>
```

See the [DruxtBreadcrumb API documentation](https://druxtjs.org/api/packages/breadcrumb/components/DruxtBreadcrumb) for more information.

## Options

### Base Druxt options

These options are available to all Druxt modules, in the `nuxt.config.js` file.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `druxt.axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `druxt.baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
