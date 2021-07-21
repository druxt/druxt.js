# Getting started

## Quickstart - Nuxt.js

1. Install the NPM module:
    ```sh
    npm i druxt-breadcrumb
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-breadcrumb',
      ],
      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org',
      },
    }
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.
- [DruxtJS](https://www.drupal.org/project/druxt) Drupal module.

### Frontend
- [Nuxt.js](https://nuxtjs.org) frontend.
