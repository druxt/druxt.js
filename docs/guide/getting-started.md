# Getting started

## Druxt.js

Druxt.js is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) frontend.

This module is included in the core [Druxt.js](http://druxtjs.org) project, the below instructions are only required if installing this module standalone.

## Quickstart

1. Install the NPM module:
    ```sh
    npm i druxt-blocks
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-blocks'
      ],
      druxt: {
        baseUrl: 'https://example.com'
      }
    }
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.
- [Druxt.js](https://www.drupal.org/project/druxt) Drupal module.

### Frontend
- [Nuxt.js](https://nuxtjs.org) frontend.
- [Druxt.js Entity](https://entity.druxtjs.org/)
- [Druxt.js Router](https://router.druxtjs.org/)
