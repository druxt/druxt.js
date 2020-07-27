# Getting started

## Druxt.js

This module is included in the core [Druxt.js](https://druxtjs.org) project, the below instructions are only required when installing this module standalone.

## Quickstart

1. Install the NPM module:
    ```sh
    npm i druxt-router
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-router'
      ],
      druxt: {
        baseUrl: 'https://example.com'
      }
    }
    ```

## Requirements

- [Drupal](https://drupal.org) JSON:API backend.
- [Decoupled router](https://www.drupal.org/project/decoupled_router) Drupal module.

### Drupal Druxt.js module

This module was designed for [Druxt.js](https://druxtjs.org) and work best with the the [Drupal Druxt.js module](https://www.drupal.org/project/druxt).
