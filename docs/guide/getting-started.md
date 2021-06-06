# Getting started

DruxtJS requires a Nuxt.js frontend and a Drupal JSON:API backend:

## Quickstart

1. Install the NPM module:
    ```sh
    npm i druxt-breadcrumb
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-breadcrumb'
      ],
      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org'
      }
    }
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.

### Frontend
- [Nuxt.js](https://nuxtjs.org) frontend.
- [DruxtJS Router](https://router.druxtjs.org/)

### Drupal DruxtJS module

This module was designed for [DruxtJS](https://druxtjs.org) and works best with the [Drupal DruxtJS module](https://www.drupal.org/project/druxt).
