# druxt

## 0.15.0

### Minor Changes

- 2ae1d6d: Reduced Fetch based UI flicker in the DruxtModule

## 0.14.0

### Minor Changes

- 85fff42: Added debug mode and Axios request logging.

  ```
  export default {
    druxt: {
      // Enable debug log messages.
      debug: true,
    }
  }
  ```

- 39e2e2e: Added ability to render readable JSON with the DruxtDebug component

  ```jsx
  <DruxtDebug :json="{ data: [{ one: true, two: false }] }" />
  ```

- 9c33d82: Made summary prop optional on DruxtDebug component
- 45bc0b9: Added Druxt version to Nuxt badge

## 0.13.0

### Minor Changes

- 77ab204: Added ability to proxy the API

  ```js
  export default {
    druxt: {
      proxy: {
        api: true
      }
    }
  };
  ```

  Creates two proxy entries:

  - The JSON:API: `${ENDPOINT}` -> `${BASEURL}${ENDPOINT}`
  - The Decoupled Router:`/router/translate-path` -> `${BASEURL}/router/translate-path`

- 77ab204: Added ability to proxy the Drupal file system

  ```js
  export default {
    druxt: {
      proxy: {
        files: "default"
      }
    }
  };
  ```

  Creates a proxy entry:

  - `/sites/${PATH}/files` -> `${BASEURL}/site/${PATH}/files`

- c4457e1: Changed template injected module components to not use a DruxtWrapper component by default.
- e7b1533: Refactored DruxtModule fetch hooks

## 0.12.0

### Minor Changes

- 897dcbc: Added createResource method to DruxtClient

  ```js
  this.$druxt.createResource({ type, attributes: {}, relationships: {} });
  ```

- 897dcbc: Added updateResource method to DruxtClient

  ```js
  await this.$druxt.updateResource({
    type,
    id,
    attributes: {},
    relationships: {}
  });
  ```

- 4504a2f: Added getRelated() method

  ```js
  await this.$druxt.getRelated(type, id, related);
  ```

- e3e634c: Enabled Components auto-discovery by default

## 0.11.0

### Minor Changes

- dae345e: Added Druxt modules settings to `$druxt.settings`

### Patch Changes

- 75ff8a9: Fixed issue with Axios settings and Storybook

## 0.10.0

### Minor Changes

- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook
- 2b8c3f3: Added DruxtDebug component
- 317184e: Added Druxt API URL to Nuxt CLI badge

## 0.9.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtModule } from 'druxt'
  +import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
  ```

## 0.8.3

### Patch Changes

- Fixed issue with attrs passthrough

## 0.8.2

### Patch Changes

- Fixed bug with fetchKey and attrs passthrough

## 0.8.1

### Patch Changes

- Fixed DruxtModule emit behavior

## 0.8.0

### Minor Changes

- Added support for default template injection to DruxtModule

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

## 0.7.1

### Patch Changes

- Fixed issue with attrs passthrough
- Updated support for Drupal JSON-API Params

Thanks to [d34dman](https://github.com/d34dman)

## 0.7.0

### Minor Changes

- Added support for v-model to DruxtModule

  _**Example:** Passing a custom entity model to the DruxtEntity component_

  ```vue
  <DruxtEntity
    type="node--article"
    v-model="{
      attributes: {
        title: 'My Entity',
        field_name: 'Value'
      },
      relationships: {}
    }"
  />
  ```

## 0.6.1

### Patch Changes

- Fixed issue with normalizaton of include/sort data
- Fixed issue with queryobject in getResource action
- Updated dependencies

## 0.6.0

### Minor Changes

- Refactored DruxtStore
  - Added support for partial resources
  - Added dehyrdation/rehydration of included resources and collections
- Fixed issue with DruxtStore reactivity

## 0.5.1

### Patch Changes

- Fixed issue with getWrapperData
- Fixed issue with DruxtStore reactivity

## 0.5.0

### Minor Changes

- Added DruxtModule component

  ```vue
  <script>
  import { DruxtModule } from "druxt";
  export default {
    name: "MyCustomDruxtModule",
    extends: DruxtModule
  };
  </script>
  ```

  - For more details, refer to the [DruxtModule API documentation](/api/packages/druxt/components/DruxtModule)

- Added \$attrs/props splitting

## 0.4.2

### Patch Changes

- Added metadata to Nuxt module

## 0.4.1

### Patch Changes

- Fixed dependency issues

## 0.4.0

### Minor Changes

- Added DruxtClient

  _**Example:** Using the DruxtClient to load a JSON:API resource in a node.js application_

  ```js
  import { DruxtClient } from 'druxt'
  const druxt = new DruxtClient('https://demo-api.druxtjs.org')
  druxt.getResource('node--page', uuid, query).then((resource) => {
    console.log('getResource', resource)
  }))
  ```

  - For more details, refer to the [DruxtClient API documentation](/api/packages/druxt/client)

- Added DruxtStore

  _**Example:** Using the DruxtStore to load a JSON:API resource within Nuxt_

  ```vue
  <script>
  export default {
    data: () => ({
      resource: null
    }),

    async fetch() {
      const resource = await this.$store.dispatch("druxt/getResource", {
        type: "node--article",
        id: uuid,
        query
      });
      this.resource = resource;
    }
  };
  </script>
  ```

  - For more details, refer to the [DruxtStore API documentation](/api/packages/druxt/stores/druxt)

- Added \$druxt plugin wrapper for DruxtClient

## 0.3.4

### Patch Changes

- Updated dependencies

## 0.3.3

### Patch Changes

- Added Inner prop to DruxtComponentMixin

## 0.3.2

### Patch Changes

- Added sorting of component options
- Fixed issue with component options

## 0.3.1

### Patch Changes

- Added DruxtWrapper to DruxtComponentMixin
- Added unique filter to component options

## 0.3.0

### Minor Changes

- Moved Site functionality to the [DruxtSite module](/modules/site)
- Added Druxt component and mixin
- Added available component options data
- Removed unused Class and Store

## 0.2.1

### Patch Changes

- Added @nuxtjs/proxy and default configuration
- Updated dependencies for no-JS support

## 0.2.0

### Minor Changes

- Updated dependencies for no-JS support

## 0.1.2

### Patch Changes

- Fixed Vuex store installation
- Updated dependencies

## 0.1.1

### Patch Changes

- Removed schema generation workaround

## 0.1.0

### Initial release
