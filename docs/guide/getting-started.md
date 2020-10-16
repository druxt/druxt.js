# Getting started

## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [NuxtJS](https://nuxtjs.org) frontend.

This module is included in the core [DruxtJS](http://druxtjs.org) project, the below instructions are only required if installing this module standalone.

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
        baseUrl: 'https://demo-api.druxtjs.org'
      }
    }
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.
- [DruxtJS](https://www.drupal.org/project/druxt) Drupal module.

### Frontend
- [NuxtJS](https://nuxtjs.org) frontend.
- [DruxtJS Entity](https://entity.druxtjs.org/)
- [DruxtJS Router](https://router.druxtjs.org/)
