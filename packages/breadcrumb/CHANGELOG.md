# druxt-breadcrumb

## 0.16.0

### Minor Changes

- 54c8ece3: Enabled dependencies when only using Nuxt druxt-breadcrumb module.
- fa5164d4: fix(#538): Fixed issue with multiple Home crumbs on multilingual sites.

### Patch Changes

- fc811db3: Add DruxtModule props to component module stories.
- Updated dependencies [49b67872]
  - druxt-router@0.28.0
  - druxt-blocks@0.16.3
  - druxt@0.20.0

## 0.15.1

### Patch Changes

- 45e14b84: Fixed support for nuxt/storybook.
- Updated dependencies [352b7a51]
  - druxt@0.19.3
  - druxt-blocks@0.16.2
  - druxt-router@0.27.4

## 0.15.0

### Minor Changes

- be21952: Added langcode to component mixins.
- be21952: Added multilingual support to Breadcrumb Block component.
- be21952: Removed duplicate Home crumb when using a multilingual backend.

### Patch Changes

- Updated dependencies [be21952]
  - druxt@0.19.0
  - druxt-router@0.27.0
  - druxt-blocks@0.16.0

## 0.14.1

### Patch Changes

- Updated dependencies [e3d5238]
  - druxt@0.18.0
  - druxt-blocks@0.15.1
  - druxt-router@0.26.1

## 0.14.0

### Minor Changes

- b79701c: feat(#249): Improved DruxtBreadcrumb storybook stories and documentation.
- 0436de4: feat(#433): Added path prop to DruxtBreadcrumb component.

  ```vue
  <DruxtBreadcrumb path="/node/1" />
  ```

- e2b8500: feat(#429): Added watch for `home` and `path` to the DruxtBreadcrumb component.

### Patch Changes

- Updated dependencies [b79701c]
  - druxt-router@0.26.0
  - druxt-blocks@0.15.0
  - druxt@0.17.0

## 0.13.4

### Patch Changes

- Updated dependencies [7b749bd]
  - druxt@0.16.0
  - druxt-router@0.25.0
  - druxt-blocks@0.14.4

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
