# DruxtEntity

[![npm](https://badgen.net/npm/v/druxt-entity)](https://www.npmjs.com/package/druxt-entity)
[![CircleCI](https://circleci.com/gh/druxt/druxt-entity.svg?style=svg)](https://circleci.com/gh/druxt/druxt-entity)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt-entity/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt-entity?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt-entity/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt-entity)


> Drupal Display Mode powered Entity, Form and Field Druxt components.


## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://entity.druxtjs.org
- Community Discord server: https://discord.druxtjs.org


## Install

`$ npm install druxt-entity`


### Nuxt.js

Add module to `nuxt.config.js`

```js
module.exports = {
  modules: ['druxt-entity'],
  druxt: {
    baseUrl: 'https://demo-api.druxtjs.org',
    entity: {
      component: {
        fields: false,
      },
      query: {
        schema: true,
        fields: ['path', 'title'],
      },
    },
  },
}
```


## Usage

### DruxtEntity component

The DruxtEntity component renders content entities using Drupal's View display modes.

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" :mode="displayMode" />
```

![Example DruxtEntity component](https://raw.githubusercontent.com/druxt/druxt-entity/HEAD/docs/images/druxt-entity.png)

See the [DruxtEntity API Documentation](https://entity.druxtjs.org/api/components/DruxtEntity.html) for more information.


### DruxtEntityForm component

The DruxtEntityForm component uses Drupal's Form displays modes for content creation and editing.

```vue
<DruxtEntityForm :type="resourceType" :mode="displayMode" />
```

![Example DruxtEntityForm component](https://raw.githubusercontent.com/druxt/druxt-entity/HEAD/docs/images/druxt-entity-form.png)

See the [DruxtEntityForm API Documentation](https://entity.druxtjs.org/api/components/DruxtEntity.html) for more information.


### Theming

Both components can be themed by providing a default template:
```vue
<DruxtEntity type="node--page" :uuid="uuid">
  <template #default="{ entity, fields, schema }">
    {{ entity }}
  </template>
</DruxtEntity>
```

The module also provides Wrapper components with scoped slots for theming:
```vue
<template>
  <div>
    <h1>{{ $attrs.entity.attributes.title }}</h1>
    <slot name="body" />
  <div>
</template>
```

See the [Druxt Theming guide](https://druxtjs.org/guide/theming.html) for more information.


## Options

### Druxt Entity options

These options are specific to this module.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `entity.components.fields` | `boolean` | No | `true` | Whether to import deprecated default Field components. |
| `entity.query.fields` | `string[]` | No | `[]` | An array of fields to filter all Entity JSON:API queries. |
| `entity.query.schema` | `boolean` | No | `false` | Whether to automatically filter fields based on Display schema. |


### Base Druxt options

These options are available to all Druxt modules.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `axios` | `object` | No | `{}` | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes | `null` | Base URL for the Drupal installation. |
