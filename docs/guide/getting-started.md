# Getting started


## Drupal

1. Install the Drupal [Druxt module](https://www.drupal.org/project/druxt):

    ```sh
    composer require drupal/druxt
    ```

2. Enable the module.

3. Setup a user with the "**access druxt resources**".


## Nuxt.js

1. Install the Nuxt.js [Druxt module](http://npmjs.com/package/druxt):

    ```sh
    npm i druxt
    ```

2. Add the module and configuration to `nuxt.config.js`:

    ```js
    module.exports = {
      modules: [
        'druxt'
      ],

      druxt: {
        baseUrl: 'https://example.com'
      }
    }
    ```
