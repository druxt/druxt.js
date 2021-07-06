# DruxtJS Blocks

[![npm](https://badgen.net/npm/v/druxt-blocks)](https://www.npmjs.com/package/druxt-blocks)
[![CircleCI](https://circleci.com/gh/druxt/druxt-blocks.svg?style=svg)](https://circleci.com/gh/druxt/druxt-blocks)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-blocks/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-blocks?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-blocks/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-blocks)

> Provides Drupal Blocks and Region components to be used within a Druxt (DRUpal nuXT) project.

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://blocks.druxtjs.org/
- Community Discord server: https://discord.druxtjs.org


## Install

`$ npm install druxt-blocks`


### Nuxt.js

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: ['druxt-blocks'],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
    blocks: {
      query: {
        fields: [],
      },
    },
  },
}
```

## Usage

### DruxtBlock component

The DruxtBlock component renders a Drupal JSON:API Block resource by ID or UUID.

```vue
<DruxtBlock :id="drupal_internal__id" />
```

```vue
<DruxtBlock :uuid="uuid" />
```

See the [DruxtBlock API Documentation](https://blocks.druxtjs.org/api/components/DruxtBlock.html) for more information.


### DruxtBlockRegion

The DruxtBlockRegion component renders all visible blocks for the specified theme region.

```vue
<DruxtBlockRegion :name="name" :theme="theme" />
```

![Example DruxtBlockRegion component](https://raw.githubusercontent.com/druxt/druxt-blocks/HEAD/docs/images/druxt-block-region.png)

See the [DruxtBlockRegion API Documentation](https://blocks.druxtjs.org/api/components/DruxtBlockRegion.html) for more information.


### Theming

Both components can be themed by providing a default template:

```vue
<DruxtBlock :id="id">
  <template #default="{ block }">
    {{ block }}
  </template>
</DruxtEntity>
```

The module also provides Wrapper components with scoped slots for theming.

See the [Druxt Theming guide](https://druxtjs.org/guide/theming.html) for more information.


## Options

### DruxtBlock options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `block.query.fields` | `string[]` | No | `[]` | An array of fields to filter all Block JSON:API queries. |


### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
| `endpoint` | `string` | No | `/jsonapi` | JSON:API Endpoint of the Drupal installation. |
