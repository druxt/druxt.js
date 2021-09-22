---
title: Getting started with DruxtSite
---

> DruxtSite gives you an out-of-the-box Drupal site experience with a Nuxt.js frontend.

Think of the DruxtSite module as a distribution of Drupal, Nuxt and Druxt to provide a Vue.js theme layer for Drupal.

* * *

## Quickstart - GitPod

Try out a pre-installed, pre-configured DruxtSite install with GitPod.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/druxt/quickstart-druxt-site)


* * *

## Getting started

All Druxt sites need both Drupal (backend) and Nuxt (frontend) to be installed.

Each codebase can live in its own directory within a single repository, or exist in seperate repositories.

* For an example of a single repository, see the [Quickstart DruxtSite repository](https://github.com/druxt/quickstart-druxt-site).
* For an example of individual repositories, see:
  * [Umami demo Nuxt repository](https://github.com/druxt/demo.druxtjs.org)
  * [Umami demo Drupal repository](https://github.com/druxt/demo-api.druxtjs.org)

* * *

### Drupal

1. [Install Drupal](https://www.drupal.org/docs/installing-drupal)

2. Download the Drupal [Druxt module](https://www.drupal.org/project/druxt):

    ```sh
    composer require drupal/druxt
    ```

3. Install the module:
   ![Install the module](/images/drupal-install.png)

4. Add the "**access druxt resources**" permission to a user/role:
   ![Druxt 'access druxt resources' permission](/images/drupal-permissions.png)

* * *

### Nuxt

1. [Install Nuxt](https://nuxtjs.org/guide/installation/)

   ```sh
   npx create-nuxt-app [destination]
   ```

2. Install the Site module:

    ```sh
    npm i druxt-site
    ```

3. Add the module and configuration to `nuxt.config.js`:

    ```js
    export default {
      modules: [
        'druxt-site'
      ],

      druxt: {
        baseUrl: 'https://demo-api.druxtjs.org'
      }
    }
    ```

    \* _**Note:** Replace `https://demo-api.druxtjs.org` with your own Drupal backend._

4. Add the `DruxtSite` component to your page or layout:

    ```vue
    <template>
      <DruxtSite :theme="theme" />
    </template>
    ```
5. Start Nuxt: `npm run dev`