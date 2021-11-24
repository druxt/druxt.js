# druxt-router

## 0.24.0

### Minor Changes

- 9161b38: Added Storybook integration for the DruxtRouter component.
- 9161b38: Added ability to render a specific route using the Path property.

  ```jsx
  <DruxtRouter path="/node/1" />
  ```

- 9161b38: Added fetch hook to DruxtRouter component.
- 9161b38: Added option to disable the DruxtRouter page middleware.

  ```js
  export default {
    druxt: {
      router: {
        middleware: false
      }
    }
  };
  ```

  Note: This is experimental and your results may vary.

## 0.23.0

### Minor Changes

- 77ab204: Added support for API Proxy

### Patch Changes

- Updated dependencies [77ab204]
  - druxt@0.13.0

## 0.22.0

### Minor Changes

- c7b267a: Throw Error on router errors

### Patch Changes

- Updated dependencies [4504a2f]
  - druxt@0.12.0

## 0.21.0

### Minor Changes

- 9d905e8: Set router `pages` option default based on presence of `pages/` directory.
- 9d905e8: Moved Nuxt module to `druxt-router/nuxt`

  ⚠ Potential breaking change

  ```diff
  -modules: ['druxt-router']
  +modules: ['druxt-router/nuxt']
  ```

- dae345e: Added module level options

### Patch Changes

- Updated dependencies [dae345e]
  - druxt@0.11.0

## 0.20.0

### Minor Changes

- 1ab762c: Enabled Nuxt Vuex store by default
- ecefef5: Added option to disable wildcard route
- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook
- cbc66cd: Added option to disable `pages/` routes

### Patch Changes

- Updated dependencies [715e5ef]
  - druxt@0.10.0

## 0.19.1

### Patch Changes

- c4616df: Fixed dependencies

## 0.19.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtRouter } from 'druxt-router'
  +import DruxtRouter from 'druxt-router/dist/components/DruxtRouter.vue'
  ```

### Patch Changes

- Updated dependencies [21170fb]
  - druxt@0.9.0

## 0.18.1

### Patch Changes

- Added `hid` to canonical meta tag
- Fixed issue with metatags

## 0.18.0

### Minor Changes

- Deprecated client methods in favour of DruxtClient

## 0.17.3

### Patch Changes

- Fixed issue with querystring and getRedirect()

## 0.17.2

### Patch Changes

- Updated dependencies

## 0.17.1

### Patch Changes

- Fixed issue with permission check

## 0.17.0

### Minor Changes

- Added support for DruxtComponentMixin

## 0.16.1

### Patch Changes

- Updated Nuxt module
- Updated dependencies

## 0.16.0

### Minor Changes

- Added documentation
- Updated dependencies

## 0.15.0

### Minor Changes

- Added resolved path to router information
- Added `all` option to getResources

## 0.14.0

### Minor Changes

- Added support for Drupal JSON:API Params
- Added addHeaders() method

## 0.13.0

### Minor Changes

- Added resource index
- Added support for remapped resources
- Added getResources method

## 0.12.0

### Minor Changes

- Added support for customisable endpoint
- Added type and uuid data
- Fixed hydration issue

## 0.11.1

### Patch Changes

- Fixed hydration issue

## 0.11.0

### Minor Changes

- Added support for additional router types
- Added support for JSON:API Views routes

## 0.10.1

### Patch Changes

- Fixed router WSOD error

## 0.10.0

### Minor Changes

- Add configurable Router component
- Refactored DruxtRouterEntityMixin
- Removed support for JSON API Deserializer

## 0.9.0

### Minor Changes

- Updated module to use shared Druxt configruation

## 0.8.0

### Minor Changes

- Improved error handling for missing routes

## 0.7.0

### Minor Changes

- Added getRoute action to Vuex store
- Refactored Nuxt plugin

## 0.6.0

### Minor Changes

- Added Axios settings support

## 0.5.0

### Minor Changes

- Added support for redirects
- Added support for JSON API resourceName

## 0.4.2

### Patch Changes

- Fixed various issues

## 0.4.1

### Patch Changes

- Fixed various issues

## 0.4.0

### Minor Changes

## 0.3.0

### Minor Changes

## 0.2.2

### Patch Changes

## 0.2.1

### Patch Changes

## 0.2.0

### Minor Changes

## 0.1.0

### Initial release
