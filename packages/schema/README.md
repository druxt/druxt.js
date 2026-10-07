<img src="https://raw.githubusercontent.com/druxt/druxt.js/HEAD/packages/schema/banner.svg" alt="DruxtSchema: content entity schema generation for displays and forms">

# DruxtSchema

[![npm](https://badgen.net/npm/v/druxt-schema)](https://www.npmjs.com/package/druxt-schema)
[![dev](https://badgen.net/npm/v/druxt-schema/dev)](https://www.npmjs.com/package/druxt-schema/v/dev)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

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

> Included with [`druxt-site`](https://druxtjs.org/modules/site). Install it separately only when composing modules yourself.

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

### Development releases

Every change merged to `develop` is published under the `dev` tag:

```sh
npm i druxt-schema@dev
```

These are unreleased builds. See [development releases](https://druxtjs.org/how-to/use-development-releases) before using one.

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

### Refresh schemas without a rebuild

Schemas are generated at build time, so a change to a display in Drupal needs a new build to show. Set `druxt.schema.refresh` to regenerate them on the Nuxt server instead:

```js
export default {
  modules: ['druxt-schema'],
  druxt: {
    cache: { secret: process.env.DRUXT_CACHE_SECRET },
    schema: { refresh: true },
  },
};
```

- The server regenerates a schema the first time a page needs it, and holds it until the next cache clear, `POST /_druxt/cache/clear` or `druxt/clearCache`. Have Drupal call the clear when configuration changes, as for content.
- The browser asks the server for a schema at `/_druxt/schema/<id>` and never reads Drupal's configuration itself. The server generates with the same access the build uses.
- Regeneration only covers schemas the build could generate. When it fails, the schema from the build is used.
- The hold is per server process, so a site with several instances needs each one cleared.
- Under `nuxt dev` there is no cache to clear, so each request regenerates the schemas it uses.
- A static site (`nuxt generate`) has no server and keeps the schemas from its build.

#### On your own server

A static site served by its own Node server can offer the same refresh. Serve the route the browser asks, and clear the held schemas where the server handles Drupal's purge:

```js
const { createSchemaRefresh } = require('druxt-schema');

const schemas = createSchemaRefresh('https://example.com');

// In the request handler.
if (pathname.startsWith('/_druxt/schema/')) {
  req.url = pathname.slice('/_druxt/schema'.length);
  return schemas.handler(req, res);
}

// Where the server handles Drupal's purge.
schemas.clear();
```

Create the refresh once and keep it. A `DruxtSchema` instance keeps the configuration it has read for as long as it lives, so one held by your own code never shows a renamed field. The refresh starts a new instance on each clear.

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

| Option           | Type      | Required | Default | Description                                                                  |
| ---------------- | --------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `schema.filter`  | `array`   | No       | `[]`    | Array of regular expression rules to filter generated schemas.               |
| `schema.refresh` | `boolean` | No       | `false` | Regenerate schemas on the Nuxt server after each cache clear, with no build. |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/schema
- Community Discord server: https://discord.druxtjs.org
