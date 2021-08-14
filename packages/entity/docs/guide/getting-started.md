# Getting started

## Quickstart - Nuxt.js

1. Install the NPM module:
    ```sh
    npm i druxt-entity
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-entity',
      ],
      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org'
      },
    }
    ```

### Storybook integration

The DruxtEntity module provides zero-config, auto-generated Storybook integration for your Drupal Entity View and Form displays.

1. Install the **@nuxtjs/storybook** module:
    ```sh
    npm i -D @nuxtjs/storybook
    ```

2. Run storybook:
    ```sh
    npx nuxt storybook
    ```

## Requirements

### Backend
- [Drupal](https://drupal.org) JSON:API backend.
- (recommended) [DruxtJS](https://www.drupal.org/project/druxt) Drupal module.

### Frontend
- (optional) [Nuxt Storybook](https://storybook.nuxtjs.org/) module.
