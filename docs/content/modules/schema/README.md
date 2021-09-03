---
title: Schema
description: Drupal Content Entity schema generator for Druxt with support for View and Form displays.
---

The Schema module uses the Drupal's Display mode configuration JSON:API data to build a Vuex Schema store.

## Features

- **Generates schemas on build**
- **Configurable schema filter**
- **View and Form schemas**

* * *

## Installation

1. Download the module:
   ```sh
   npm i druxt-schema
   ```

2. Add the module to `nuxt.config.js`:
   ```js
   export default {
     modules: ['druxt-schema'],
   }
   ```

* * *

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
      ]
    }
  }
}
```

* * *
