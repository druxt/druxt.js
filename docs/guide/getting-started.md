# Getting started

DruxtJS requires a Nuxt.js frontend and a Drupal JSON:API backend:

## Quickstart

1. Install the NPM module:
    ```sh
    npm i druxt-entity
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt',
        'druxt-entity',
        'druxt-schema'
      ],
      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org'
      }
    }
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.
- [Decoupled router](https://www.drupal.org/project/decoupled_router) Drupal module.

### Frontend
- [Nuxt.js](https://nuxtjs.org) frontend.
- [DruxtJS](https://druxtjs.org)
- [DruxtJS Schema](https://schema.druxtjs.org)

### Drupal DruxtJS module

This module was designed for [DruxtJS](https://druxtjs.org) and works best with the [Drupal DruxtJS module](https://www.drupal.org/project/druxt).
