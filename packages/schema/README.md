<img src="./banner.svg" alt="DruxtSchema: content entity schema generation for displays and forms">

# DruxtSchema

[![npm](https://badgen.net/npm/v/druxt-schema)](https://www.npmjs.com/package/druxt-schema)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/branch/develop/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Drupal Content Entity schema generator for Druxt with support for View and Form displays.

DruxtSchema turns Drupal display configuration into build-time schemas. For
each entity type, bundle and display mode it records which fields render, in
what order and with which formatter settings, and stores the result in a Vuex
store. The Entity module renders from these schemas at runtime, so your
frontend follows Drupal's display configuration without querying it on every
request.

## Features

- **Generates schemas on build**
- **Configurable schema filter**
- **View and Form schemas**

---

## Installation

> Included with [`druxt-site`](https://druxtjs.org/modules/site); install separately only when composing modules yourself.

1. Install the package:

   ```sh
   npm i druxt-schema
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-schema'],
   };
   ```

---

## Settings

### Filter schemas

The Schema module will generate a schema for all available content entity type by bundle, display mode and schema type.

This generated schemas can be filtered by providing a `druxt.schema.filter` setting in the `nuxt.config.js` file:

```js
export default {
  modules: ['druxt-schema'],
  druxt: {
    schema: {
      filter: [
        // List specific schema files to generate.
        'node--page--default--view',
        'media--image--square--view',
        // Or use a regular expression.
        '.*?--form',
      ],
    },
  },
};
```

---

## API

- For the full class and store reference, see the
  [DruxtSchema API documentation](https://druxtjs.org/api/packages/schema).

---

## Options

### Druxt options

These options are available to all Druxt modules.

| Option     | Type     | Required | Default    | Description                                                                  |
| ---------- | -------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `axios`    | `object` | No       | `{}`       | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl`  | `string` | Yes      | `null`     | Base URL for the Drupal installation.                                        |
| `endpoint` | `string` | No       | `/jsonapi` | JSON:API Endpoint of the Drupal installation.                                |

### Druxt Schema options

These options are specific to this module.

| Option          | Type    | Required | Default | Description                                                    |
| --------------- | ------- | -------- | ------- | -------------------------------------------------------------- |
| `schema.filter` | `array` | No       | `[]`    | Array of regular expression rules to filter generated schemas. |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/schema
- Community Discord server: https://discord.druxtjs.org
