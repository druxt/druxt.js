# Getting started

## Druxt.js

Druxt.js is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) frontend.

This module is included in the core [Druxt.js](https://druxtjs.org) project, the below instructions are only required if installing this module standalone.

## Quickstart

1. Install the NPM module:
    ```sh
    npm i druxt-router
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-router',
      ],
      druxt: {
        baseUrl: 'https://example.com'
      }
    }
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.
- [Decoupled router](https://www.drupal.org/project/decoupled_router) Drupal module.

### Frontend
- [Nuxt.js](https://nuxtjs.org) frontend.

### Drupal Druxt.js module

This module was designed for [Druxt.js](https://druxtjs.org) and work best with the the [Drupal Druxt.js module](https://www.drupal.org/project/druxt).
