# druxt-views

## 0.13.0

### Minor Changes

- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook

### Patch Changes

- 49454cb: Fixed path to components in Storybook
- Updated dependencies [1ab762c]
  - druxt-router@0.20.0
  - druxt-blocks@0.12.0
  - druxt@0.10.0
  - druxt-entity@0.18.0

## 0.12.1

### Patch Changes

- c4616df: Fixed dependencies
- Updated dependencies [c4616df]
  - druxt-blocks@0.11.1
  - druxt-entity@0.17.1
  - druxt-router@0.19.1

## 0.12.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtView } from 'druxt-views'
  +import DruxtView from 'druxt-views/dist/components/DruxtView.vue'
  ```

### Patch Changes

- Updated dependencies [21170fb]
  - druxt-blocks@0.11.0
  - druxt@0.9.0
  - druxt-entity@0.17.0
  - druxt-router@0.19.0

## 0.11.0

### Minor Changes

- Added support for default template injection

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080)

- Added ability to load by UUID or View ID

## 0.10.0

### Minor Changes

- Added empty content to results slot if no results

## 0.9.3

### Patch Changes

- Fixed issue with model filter forcing a refresh

## 0.9.2

### Patch Changes

- Added fetchKey to fix hydration issues

## 0.9.1

### Patch Changes

- Fixed issue with default view mode value

## 0.9.0

### Minor Changes

- Added ability to filter JSON:API fields
- Refactored components to use DruxtModule
- Fixed issues with Storybook integration

## 0.8.3

### Patch Changes

- Fixed missing attachement Views

## 0.8.2

### Patch Changes

- Fixed issues with Storybook integration

## 0.8.1

### Patch Changes

- Fixed issues with Storybook integration
- Fixed missing attachements Views

## 0.8.0

### Minor Changes

- Added Storybook intergration
- Fixed broken View results

## 0.7.2

### Patch Changes

- Fixed broken View results

## 0.7.1

### Patch Changes

- Fixed deprecation notice

## 0.7.0

### Minor Changes

- Refactored module to use DruxtClient/DruxtStore
- Added pagination
- Added exposed sorts
- Added exposed filters
- Added Views Vuex store

## 0.6.2

### Patch Changes

- Fixed issue with View display data

## 0.6.1

### Patch Changes

- Updated dependencies

## 0.6.0

### Minor Changes

- Added DruxtRouter View component
- Updated dependencies

## 0.5.1

### Patch Changes

- Updated dependencies

## 0.5.0

### Minor Changes

- Added support for DruxtComponentMixin
- Updated dependencies

## 0.4.2

### Patch Changes

- Updated attachment_before/after slots
- Updated dependencies

## 0.4.1

### Patch Changes

- Added attachment_before/after slots

## 0.4.0

### Minor Changes

## 0.3.0

### Minor Changes

## 0.2.1

### Patch Changes

## 0.2.0

### Minor Changes

## 0.1.0

### Initial release
