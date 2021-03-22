# Getting started

## Quickstart - Nuxt.js

1. Install the DruxtViews module:
    ```sh
    npm i druxt-views
    ```

2. Add the module and configure as required in `nuxt.config.js`:
    ```js
    module.exports = {
      modules: [
        'druxt-views'
      ],
      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org',
      },
    }
    ```

### Storybook integration

The DruxtViews module provides zero-config, auto-generated Storybook integration for your Drupal Views.

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
- [JSON:API Views](https://www.drupal.org/project/jsonapi_views) Drupal module.
- (recommended) [DruxtJS](https://www.drupal.org/project/druxt) Drupal module.

### Frontend
- (optional) [Nuxt Storybook](https://storybook.nuxtjs.org/) module.
