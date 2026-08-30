---
title: Getting started with DruxtSite
description: Install DruxtSite and connect a Nuxt 2 frontend to a Drupal backend.
---

> DruxtSite gives you an out-of-the-box Drupal site experience with a Nuxt.js frontend.

DruxtSite combines Drupal, Nuxt and Druxt into a Vue.js theme layer for Drupal.

---

## Getting started

All Druxt sites need both Drupal (backend) and Nuxt (frontend) to be installed.

Each codebase can live in its own directory within one repository, or exist in separate repositories.

- For an example combining both into one repository, see the [Quickstart repository](https://github.com/druxt/quickstart).
- For an example of individual repositories, see:
  - [Umami demo Nuxt repository](https://github.com/druxt/demo.druxtjs.org)
  - [Umami demo Drupal repository](https://github.com/druxt/demo-api.druxtjs.org)

---

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

---

### Nuxt

1. Start from a **Nuxt 2** project. DruxtSite targets Nuxt 2 and Vue 2, so
   `npx create-nuxt-app` is not a route to one any more: it now scaffolds
   Nuxt 3 or later, which DruxtSite does not support.

   The quickstart gives you a working Nuxt 2 tree with Druxt already wired in:

   ```sh
   npx giget@latest gh:druxt/quickstart#develop my-druxt-site
   ```

   To add DruxtSite to an existing project instead, continue from step 2. It
   must be on Nuxt 2.

2. Install the Site module:

   ```sh
   npm i druxt-site
   ```

3. Add the module and configuration to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-site'],

     druxt: {
       baseUrl: 'https://demo-api.druxtjs.org',
     },
   };
   ```

   \* _Replace `https://demo-api.druxtjs.org` with your own Drupal backend._

4. Add the `DruxtSite` component to your page or layout:

   ```vue
   <template>
     <DruxtSite :theme="theme" />
   </template>
   ```

5. Start Nuxt: `npm run dev`
