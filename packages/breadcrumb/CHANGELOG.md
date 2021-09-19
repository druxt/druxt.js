# druxt-breadcrumb

## 0.11.0

### Minor Changes

- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook

### Patch Changes

- Updated dependencies [1ab762c]
  - druxt-router@0.20.0
  - druxt-blocks@0.12.0
  - druxt@0.10.0

## 0.10.1

### Patch Changes

- c4616df: Fixed dependencies
- Updated dependencies [c4616df]
  - druxt-blocks@0.11.1
  - druxt-router@0.19.1

## 0.10.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtBreadcrumb } from 'druxt-breadcrumb'
  +import DruxtBreadcrumb from 'druxt-breadcrumb/dist/components/DruxtBreadcrumb.vue'
  ```

### Patch Changes

- Updated dependencies [21170fb]
  - druxt-blocks@0.11.0
  - druxt@0.9.0
  - druxt-router@0.19.0

## 0.9.0

### Minor Changes

- Added support for default template injection
  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080)

## 0.8.0

### Minor Changes

- Updated component to use DruxtModule

## 0.7.2

### Patch Changes

- Updated dependencies

## 0.7.1

### Patch Changes

- Updated dependencies

## 0.7.0

### Minor Changes

- Added support for the Druxt component

## 0.6.1

### Patch Changes

- Updated dependencies

## 0.6.0

### Minor Changes

- Refactored module

## 0.5.0

### Minor Changes

## 0.4.0

### Minor Changes

## 0.3.2

### Patch Changes

## 0.3.1

### Patch Changes

## 0.3.0

### Minor Changes

## 0.2.0

### Minor Changes

## 0.1.1

### Patch Changes

## 0.1.0

### Minor Changes
