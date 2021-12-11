# druxt-breadcrumb

## 0.13.3

### Patch Changes

- Updated dependencies [2ae1d6d]
  - druxt@0.15.0
  - druxt-blocks@0.14.3
  - druxt-router@0.24.2

## 0.13.2

### Patch Changes

- Updated dependencies [45bc0b9]
  - druxt@0.14.0
  - druxt-blocks@0.14.2
  - druxt-router@0.24.1

## 0.13.1

### Patch Changes

- Updated dependencies [9161b38]
  - druxt-router@0.24.0
  - druxt-blocks@0.14.1

## 0.13.0

### Minor Changes

- e7b1533: Refactored DruxtModule fetch hooks

### Patch Changes

- Updated dependencies [77ab204]
  - druxt-blocks@0.14.0
  - druxt@0.13.0
  - druxt-router@0.23.0

## 0.12.1

### Patch Changes

- Updated dependencies [4504a2f]
  - druxt@0.12.0
  - druxt-router@0.22.0
  - druxt-blocks@0.13.1

## 0.12.0

### Minor Changes

- 8d28c18: Updated storybook integration

### Patch Changes

- 9a1d720: Fixed error when no crumbs are present
- dae345e: Removed unused `$druxtBreadcrumb` plugin
- Updated dependencies [9d905e8]
  - druxt-router@0.21.0
  - druxt-blocks@0.13.0
  - druxt@0.11.0

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
