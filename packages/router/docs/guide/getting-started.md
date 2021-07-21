# Getting started

DruxtJS requires a Nuxt.js frontend and a Drupal JSON:API backend:

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

### Drupal DruxtJS module

This module was designed for [DruxtJS](https://druxtjs.org) and works best with the [Drupal DruxtJS module](https://www.drupal.org/project/druxt).
