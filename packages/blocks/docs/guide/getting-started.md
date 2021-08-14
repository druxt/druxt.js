# Getting started

## Quickstart - Nuxt.js

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
      },
    }
    ```

### Storybook integration

The DruxtBlocks module provides zero-config, auto-generated Storybook integration for your Drupal Blocks and regions.

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
- [DruxtJS](https://www.drupal.org/project/druxt) Drupal module.

### Frontend
- [Nuxt.js](https://nuxtjs.org) frontend.
- (optional) [Nuxt Storybook](https://storybook.nuxtjs.org/) module.
