<img src="./banner.svg" alt="DruxtEntity: Display Mode powered Entity, Form and Field components">

# DruxtEntity

[![npm](https://badgen.net/npm/v/druxt-entity)](https://www.npmjs.com/package/druxt-entity)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Drupal Display Mode-powered Entity, Form and Field Druxt components.

DruxtEntity renders Drupal content in Vue. Point the `DruxtEntity` component
at a resource type and UUID and it renders the entity's fields exactly as the
Drupal display mode configures them. `DruxtEntityForm` does the same for
forms, with submission and validation handled for you. Drupal keeps deciding
what shows where; your Nuxt components decide how it looks.

![Example DruxtEntity component](https://druxtjs.org/images/druxt-entity.png)

## Features

- Vue.js components:
  - **DruxtEntity**: Render a Drupal Content Entity by UUID
  - **DruxtEntityForm**: Render a Drupal Content Entity form
- **Druxt settings**: Include and filter resource fields
- **Druxt Router** integration
- **@nuxtjs/Storybook** integration

---

## Installation

> Included with [`druxt-site`](https://druxtjs.org/modules/site); install separately only when composing modules yourself.

1. Install the package:

   ```sh
   npm i druxt-entity
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-entity'],
   };
   ```

---

## Vue.js Components

### DruxtEntity

Renders a Drupal Content Entity by JSON:API resource type, UUID, view mode and schema type.

Fields are rendered as [DruxtField](https://druxtjs.org/api/packages/entity/components/DruxtField) components, based on the Drupal display mode configuration.

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" :mode="displayMode" />
```

- For more details, refer to the [DruxtEntity component API documentation](https://druxtjs.org/api/packages/entity/components/DruxtEntity).

### DruxtEntityForm

Renders a Drupal Content Entity form with submission and validation support.

```vue
<DruxtEntityForm
  :type="resourceType"
  :mode="displayMode"
  @error="onError"
  @submit="onSubmit"
  v-model="entity"
/>
```

![Example DruxtEntityForm component](https://druxtjs.org/images/druxt-entity-form.png)

- For more details, refer to the [DruxtEntityForm component API documentation](https://druxtjs.org/api/packages/entity/components/DruxtEntityForm).

---

## Settings

### Entity queries

Entity query settings can be provided to include related resources and filter the returned fields.

- **fields**: An array of strings, or an array of arrays. Formatted for the Drupal JSON:API Params `addFields` method, used to filter the returned resource fields.
- **include**: An array of relationship id's to include in the returned resources.
- **schema**: Boolean, if `true` fields will be populated by the Drupal Display schema information.

_Example: Wrapper component with Query settings:_

```vue
<script>
export default {
  druxt: {
    query: {
      fields: ['title', 'path'],
      schema: true,
    },
  },
};
</script>
```

_Example: DruxtEntity with settings property:_

```vue
<template>
  <DruxtEntity
    :settings="{
      query: {
        include: ['field_media_image', 'field_media_image.field_media_image'],
        fields: [
          ['file--file', ['uri']],
          ['media--image', []],
        ],
      },
    }"
    type="node--recipe"
    :uuid="uuid"
  />
</template>
```

The default behaviour can be set via `nuxt.config.js`:

```js
druxt: {
  entity: {
    query: {
      fields: ['path', 'title'], // Apply filter to all Entity queries.
      schema: true, // Filter by display mode field settings.
    },
  },
}
```

---

## Router support

The DruxtEntity module provides a **DruxtRouterEntity** component that is used by the Druxt Router module to render a Content Entity route.

- For more details, see the [Druxt Router module](https://druxtjs.org/modules/router).

---

## Storybook

DruxtEntity provides zero-config, auto-generated Storybook integration with a live data connection to your Druxt backend.

- For more details, see the [Storybook guide](https://druxtjs.org/how-to/storybook).

---

## Deprecations

The default DruxtField components are deprecated. See the
[deprecations page](https://druxtjs.org/modules/entity/deprecations) for what replaces them.

---

## Options

### Druxt Entity options

These options are specific to this module.

| Option                     | Type                     | Required | Default | Description                                                                    |
| -------------------------- | ------------------------ | -------- | ------- | ------------------------------------------------------------------------------ |
| `entity.components.fields` | `boolean`                | No       | `false` | Whether to import deprecated default Field components.                         |
| `entity.query.fields`      | `string[] \| string[][]` | No       | `[]`    | An array of fields, or of field arrays, to filter all Entity JSON:API queries. |
| `entity.query.schema`      | `boolean`                | No       | `false` | Whether to automatically filter fields based on Display schema.                |

### Base Druxt options

These options are available to all Druxt modules.

| Option    | Type     | Required | Default | Description                                                                  |
| --------- | -------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `axios`   | `object` | No       | `{}`    | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes      | `null`  | Base URL for the Drupal installation.                                        |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/entity
- Community Discord server: https://discord.druxtjs.org
