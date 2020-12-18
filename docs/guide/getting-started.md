# Getting started

DruxtJS requires a NuxtJS frontend and a Drupal JSON:API enabled backend:

## Drupal

1. [Install Drupal](https://www.drupal.org/docs/installing-drupal)

2. Download the Drupal [Druxt module](https://www.drupal.org/project/druxt):

    ```sh
    composer require drupal/druxt
    ```

3. Install the module:
   ![Install the module](./images/install.png)

4. Add the "**access druxt resources**" permission to a user/role:
   ![Install the module](./images/permissions.png)

5. Enable and configure **CORS** in the your sites `services.yml` file.


## Nuxt

1. [Install NuxtJS](https://nuxtjs.org/guide/installation/)

2. Install the [DruxtJS Site module](http://npmjs.com/package/druxt-site):

    ```sh
    npm i druxt-site
    ```

3. Add the module and configuration to `nuxt.config.js`:

    ```js
    module.exports = {
      modules: [
        'druxt-site'
      ],

      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org'
      }
    }
    ```

4. Add the `DruxtSite` component to your page or layout:

    ```vue
    <template>
      <DruxtSite :theme="theme" />
    </tempalte>
    ```
