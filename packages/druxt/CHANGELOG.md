# druxt

## 0.24.0 - 2023-11-02

- No package changes; version alignment release.

## 0.23.0 - 2023-07-25

### Minor Changes

- Added attrs passthrough to the DruxtWrapper component, so attributes like `role` set via the wrapper reach the rendered markup. ([#87](https://github.com/druxt/druxt.js/issues/87), [`7664d90`](https://github.com/druxt/druxt.js/commit/7664d90d))

## 0.22.0 - 2023-07-05

### Minor Changes

- Added druxt/flushCollection and druxt/flushResource mutations for flushing cached JSON:API data, for example on logout. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))
- Added bypassCache option to druxt/getCollection and druxt/getResource actions. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))

## 0.21.1 - 2023-05-15

### Patch Changes

- Fixed included resources being fetched without the language prefix on multilingual sites, which returned default-language content when revisiting a page by client-side navigation. ([#628](https://github.com/druxt/druxt.js/issues/628), [`e46a329`](https://github.com/druxt/druxt.js/commit/e46a3290)) Thanks [@nx-alejandrolacasa](https://github.com/nx-alejandrolacasa).

## 0.21.0 - 2022-11-03

### Minor Changes

- Added DruxtDevelTemplate component to simplify template creation in development mode. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))
- Updated missing default slot message with DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))
- Added Vue devtools plugin. ([#583](https://github.com/druxt/druxt.js/issues/583), [`29905ff`](https://github.com/druxt/druxt.js/commit/29905ff6))

## 0.20.0 - 2022-08-12

### Minor Changes

- Removed the hard permission-check error from API requests, so content a role cannot access (for example permission-restricted blocks) no longer breaks the page render. ([#543](https://github.com/druxt/druxt.js/issues/543), [`49b6787`](https://github.com/druxt/druxt.js/commit/49b67872))

## 0.19.3 - 2022-07-08

### Patch Changes

- Normalized slashes for baseUrl and endpoint options. ([`44f97b9`](https://github.com/druxt/druxt.js/commit/44f97b9c))
- Fixed plugin paths issue for Windows users. ([`352b7a5`](https://github.com/druxt/druxt.js/commit/352b7a51))
- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))

## 0.19.2 - 2022-05-30

### Patch Changes

- Fixed issue with single-lingual sites using JSON:API Extras. ([`9819eee`](https://github.com/druxt/druxt.js/commit/9819eeed))
- Changed order of Druxt Proxy entries. ([`4ff0ad8`](https://github.com/druxt/druxt.js/commit/4ff0ad81))

## 0.19.1 - 2022-05-24

### Patch Changes

- Fixed issues on single-lingual sites. ([`4150e25`](https://github.com/druxt/druxt.js/commit/4150e25))

## 0.19.0 - 2022-05-23

### Minor Changes

- Added langcode / prefix support to DruxtClient methods. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  ```js
  const data = await druxt.getResource("node--article", id, undefined, "en");
  ```

- Added langcode-suffixed component options for multilingual templates. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  example:

  ```diff
  + DruxtEntityNodeArticleFullEn
  + DruxtEntityNodeArticleFullEs
  ```

- Added langcode prefix support to the DruxtStore. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  ⚠ Potential breaking change

  ```diff
  - $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12
  + $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12[undefined]
  + $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12.en
  + $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12.es
  - $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec']
  + $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec'][undefined]
  + $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec'].en
  + $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec'].es
  ```

- Added language prefixes to API proxy support. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added multilingual support to the base DruxtModule component. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

## 0.18.3 - 2022-05-06

### Patch Changes

- Fixed proxy when using deprecated Axios options. ([`e6cf1fc`](https://github.com/druxt/druxt.js/commit/e6cf1fc))

## 0.18.2 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))

## 0.18.1 - 2022-03-17

### Patch Changes

- Fixed Axios proxy being incorrectly enabled. ([`80164a1`](https://github.com/druxt/druxt.js/commit/80164a1))

## 0.18.0 - 2022-02-23

### Minor Changes

- Added support for the @nuxtjs/axios module. ([`e3d5238`](https://github.com/druxt/druxt.js/commit/e3d5238))

## 0.17.0 - 2022-02-07

### Minor Changes

- Added README story to storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added required props error to DruxtModule components. ([`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added DruxtModule story to storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added DruxtDebug story to storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Fixed errors in storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`d7e92b2`](https://github.com/druxt/druxt.js/commit/d7e92b2))

## 0.16.0 - 2021-12-30

### Minor Changes

- Made the \$druxt plugin first to be available to all Druxt module plugins. ([`dc226c2`](https://github.com/druxt/druxt.js/commit/dc226c2))
- Added improved error handling, with more context in error messages. ([#408](https://github.com/druxt/druxt.js/issues/408), [`7b749bd`](https://github.com/druxt/druxt.js/commit/7b749bd5), [`bc079cf`](https://github.com/druxt/druxt.js/commit/bc079cfb))

## 0.15.0 - 2021-12-11

### Minor Changes

- Reduced Fetch based UI flicker in the DruxtModule. ([`2ae1d6d`](https://github.com/druxt/druxt.js/commit/2ae1d6d))

## 0.14.0 - 2021-12-04

### Minor Changes

- Added debug mode and Axios request logging. ([`85fff42`](https://github.com/druxt/druxt.js/commit/85fff42))

  ```
  export default {
    druxt: {
      // Enable debug log messages.
      debug: true,
    }
  }
  ```

- Added ability to render readable JSON with the DruxtDebug component. ([`39e2e2e`](https://github.com/druxt/druxt.js/commit/39e2e2e))

  ```jsx
  <DruxtDebug :json="{ data: [{ one: true, two: false }] }" />
  ```

- Made summary prop optional on DruxtDebug component. ([`9c33d82`](https://github.com/druxt/druxt.js/commit/9c33d82))
- Added Druxt version to Nuxt badge. ([`45bc0b9`](https://github.com/druxt/druxt.js/commit/45bc0b9))

## 0.13.0 - 2021-11-10

### Minor Changes

- Added ability to proxy the API. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))

  ```js
  export default {
    druxt: {
      proxy: {
        api: true,
      },
    },
  };
  ```

  Creates two proxy entries:

  - The JSON:API: `${ENDPOINT}` -> `${BASEURL}${ENDPOINT}`
  - The Decoupled Router:`/router/translate-path` -> `${BASEURL}/router/translate-path`

- Added ability to proxy the Drupal file system. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))

  ```js
  export default {
    druxt: {
      proxy: {
        files: "default",
      },
    },
  };
  ```

  Creates a proxy entry:

  - `/sites/${PATH}/files` -> `${BASEURL}/site/${PATH}/files`

- Changed template-injected module components to not use a DruxtWrapper component by default. ([`c4457e1`](https://github.com/druxt/druxt.js/commit/c4457e1))
- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

## 0.12.0 - 2021-10-10

### Minor Changes

- Added createResource method to DruxtClient. ([`897dcbc`](https://github.com/druxt/druxt.js/commit/897dcbc))

  ```js
  this.$druxt.createResource({ type, attributes: {}, relationships: {} });
  ```

- Added updateResource method to DruxtClient. ([`897dcbc`](https://github.com/druxt/druxt.js/commit/897dcbc))

  ```js
  await this.$druxt.updateResource({
    type,
    id,
    attributes: {},
    relationships: {},
  });
  ```

- Added getRelated() method. ([`4504a2f`](https://github.com/druxt/druxt.js/commit/4504a2f))

  ```js
  await this.$druxt.getRelated(type, id, related);
  ```

- Enabled Components auto-discovery by default. ([`e3e634c`](https://github.com/druxt/druxt.js/commit/e3e634c))

## 0.11.0 - 2021-09-29

### Minor Changes

- Added Druxt modules settings to `$druxt.settings`. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))

### Patch Changes

- Fixed issue with Axios settings and Storybook. ([`75ff8a9`](https://github.com/druxt/druxt.js/commit/75ff8a9))

## 0.10.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))
- Added DruxtDebug component. ([`2b8c3f3`](https://github.com/druxt/druxt.js/commit/2b8c3f3))
- Added Druxt API URL to Nuxt CLI badge. ([`317184e`](https://github.com/druxt/druxt.js/commit/317184e))

## 0.9.0 - 2021-09-13

### Patch Changes

- Updated the scule dependency to ^0.2.0. ([`d27081b`](https://github.com/druxt/druxt.js/commit/d27081b2))

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtModule } from 'druxt'
  +import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
  ```

## 0.8.3 - 2021-07-06

### Patch Changes

- Fixed issue with attrs passthrough.

## 0.8.2 - 2021-07-06

### Patch Changes

- Fixed bug with fetchKey and attrs passthrough.

## 0.8.1 - 2021-06-22

### Patch Changes

- Fixed DruxtModule emit behavior.

## 0.8.0 - 2021-06-20

### Minor Changes

- Added support for default template injection to DruxtModule.

  _**Example:** Default template injection with DruxtEntity and DruxtMenu components_

  ```vue
  <DruxtEntity v-bind="props">
    <template #default="{ entity }">
      <h2>{{ entity.attributes.title }}</h2>
      <DruxtMenu name="main" :depth="1" :parentId="parentId(entity)">
        <template #default="{ items }">
          {{ items }}
        </template>
      </DruxtMenu>
    </template>
  </DruxtEntity>
  ```

## 0.7.1 - 2021-06-15

### Patch Changes

- Fixed issue with attrs passthrough.
- Updated support for Drupal JSON-API Params.

Thanks to [d34dman](https://github.com/d34dman)

## 0.7.0 - 2021-06-10

### Minor Changes

- Added support for v-model to DruxtModule.

  _**Example:** Passing a custom entity model to the DruxtEntity component_

  ```vue
  <DruxtEntity
    type="node--article"
    v-model="{
      attributes: {
        title: 'My Entity',
        field_name: 'Value',
      },
      relationships: {},
    }"
  />
  ```

## 0.6.1 - 2021-06-10

### Patch Changes

- Fixed issue with normalization of include/sort data.
- Fixed issue with queryobject in getResource action.
- Updated dependencies.

## 0.6.0 - 2021-05-19

### Minor Changes

- Refactored DruxtStore.
  - Added support for partial resources
  - Added dehydration/rehydration of included resources and collections
- Fixed issue with DruxtStore reactivity.

## 0.5.1 - 2021-03-16

### Patch Changes

- Fixed issue with getWrapperData.
- Fixed issue with DruxtStore reactivity.

## 0.5.0 - 2021-03-14

### Minor Changes

- Added DruxtModule component.

  ```vue
  <script>
  import { DruxtModule } from "druxt";
  export default {
    name: "MyCustomDruxtModule",
    extends: DruxtModule,
  };
  </script>
  ```

  - For more details, refer to the [DruxtModule API documentation](/api/packages/druxt/components/DruxtModule)

- Added \$attrs/props splitting.

## 0.4.2 - 2021-03-02

### Patch Changes

- Added metadata to Nuxt module.

## 0.4.1 - 2021-02-09

### Patch Changes

- Fixed dependency issues.

## 0.4.0 - 2021-02-01

### Minor Changes

- Added DruxtClient.

  _**Example:** Using the DruxtClient to load a JSON:API resource in a node.js application_

  ```js
  import { DruxtClient } from 'druxt'
  const druxt = new DruxtClient('https://demo-api.druxtjs.org')
  druxt.getResource('node--page', uuid, query).then((resource) => {
    console.log('getResource', resource)
  }))
  ```

  - For more details, refer to the [DruxtClient API documentation](/api/packages/druxt/client)

- Added DruxtStore.

  _**Example:** Using the DruxtStore to load a JSON:API resource within Nuxt_

  ```vue
  <script>
  export default {
    data: () => ({
      resource: null,
    }),

    async fetch() {
      const resource = await this.$store.dispatch("druxt/getResource", {
        type: "node--article",
        id: uuid,
        query,
      });
      this.resource = resource;
    },
  };
  </script>
  ```

  - For more details, refer to the [DruxtStore API documentation](/api/packages/druxt/stores/druxt)

- Added \$druxt plugin wrapper for DruxtClient.

## 0.3.4 - 2021-01-08

### Patch Changes

- Updated dependencies.

## 0.3.3 - 2020-10-19

### Patch Changes

- Added Inner prop to DruxtComponentMixin.

## 0.3.2 - 2020-10-13

### Patch Changes

- Added sorting of component options.
- Fixed issue with component options.

## 0.3.1 - 2020-10-11

### Patch Changes

- Added DruxtWrapper to DruxtComponentMixin.
- Added unique filter to component options.

## 0.3.0 - 2020-10-10

### Minor Changes

- Moved Site functionality to the [DruxtSite module](/modules/site).
- Added Druxt component and mixin.
- Added available component options data.
- Removed unused Class and Store.

## 0.2.1 - 2020-10-01

### Patch Changes

- Added @nuxtjs/proxy and default configuration.
- Updated dependencies.

## 0.2.0 - 2020-09-08

### Minor Changes

- Updated dependencies.

## 0.1.2 - 2020-08-22

### Patch Changes

- Fixed Vuex store installation.
- Updated dependencies.

## 0.1.1 - 2020-07-20

### Patch Changes

- Removed schema generation workaround.

## 0.1.0 - 2020-07-18

### Initial release
