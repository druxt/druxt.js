# druxt-site

## 0.10.3

### Patch Changes

- Updated dependencies [2ae1d6d]
  - druxt@0.15.0
  - druxt-views@0.17.0
  - druxt-blocks@0.14.3
  - druxt-breadcrumb@0.13.3
  - druxt-entity@0.21.4
  - druxt-menu@0.15.2
  - druxt-router@0.24.2
  - druxt-schema@0.9.2

## 0.10.2

### Patch Changes

- Updated dependencies [45bc0b9]
  - druxt@0.14.0
  - druxt-blocks@0.14.2
  - druxt-breadcrumb@0.13.2
  - druxt-entity@0.21.3
  - druxt-menu@0.15.1
  - druxt-router@0.24.1
  - druxt-schema@0.9.1
  - druxt-views@0.16.2

## 0.10.1

### Patch Changes

- Updated dependencies [9161b38]
  - druxt-router@0.24.0
  - druxt-blocks@0.14.1
  - druxt-breadcrumb@0.13.1
  - druxt-entity@0.21.2
  - druxt-views@0.16.1

## 0.10.0

### Minor Changes

- 77ab204: Replaced File Proxy with Druxt proxy
- e7b1533: Refactored DruxtModule fetch hooks

### Patch Changes

- Updated dependencies [025315a]
  - druxt-entity@0.21.0
  - druxt-views@0.16.0
  - druxt-schema@0.9.0
  - druxt-blocks@0.14.0
  - druxt-breadcrumb@0.13.0
  - druxt@0.13.0
  - druxt-menu@0.15.0
  - druxt-router@0.23.0

## 0.9.1

### Patch Changes

- Updated dependencies [4504a2f]
  - druxt@0.12.0
  - druxt-router@0.22.0
  - druxt-menu@0.14.1
  - druxt-entity@0.20.0
  - druxt-views@0.15.0
  - druxt-blocks@0.13.1
  - druxt-breadcrumb@0.12.1
  - druxt-schema@0.8.1

## 0.9.0

### Minor Changes

- 8d28c18: Updated storybook integration
- 97d24d5: Added default theme option and fallback to DruxtSite component
- 97d24d5: Added default layout

### Patch Changes

- dae345e: Fixed default @nuxtjs/proxy settings
- Updated dependencies [9d905e8]
  - druxt-router@0.21.0
  - druxt-views@0.14.0
  - druxt-breadcrumb@0.12.0
  - druxt-blocks@0.13.0
  - druxt-entity@0.19.0
  - druxt-menu@0.14.0
  - druxt-schema@0.8.0
  - druxt@0.11.0

## 0.8.0

### Minor Changes

- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook

### Patch Changes

- Updated dependencies [1ab762c]
  - druxt-router@0.20.0
  - druxt-blocks@0.12.0
  - druxt-breadcrumb@0.11.0
  - druxt@0.10.0
  - druxt-entity@0.18.0
  - druxt-menu@0.13.0
  - druxt-views@0.13.0
  - druxt-schema@0.7.10

## 0.7.1

### Patch Changes

- c4616df: Fixed dependencies
- Updated dependencies [c4616df]
  - druxt-blocks@0.11.1
  - druxt-breadcrumb@0.10.1
  - druxt-entity@0.17.1
  - druxt-menu@0.12.1
  - druxt-router@0.19.1
  - druxt-schema@0.7.9
  - druxt-views@0.12.1

## 0.7.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtSite } from 'druxt-site'
  +import DruxtSite from 'druxt-site/dist/components/DruxtSite.vue'
  ```

- da19102: Added BlockRegion \$refs to DruxtSite component

### Patch Changes

- a6a6592: Added fallback to Nuxt component if no Blocks are set
- Updated dependencies [21170fb]
  - druxt-blocks@0.11.0
  - druxt-breadcrumb@0.10.0
  - druxt@0.9.0
  - druxt-entity@0.17.0
  - druxt-menu@0.12.0
  - druxt-router@0.19.0
  - druxt-views@0.12.0
  - druxt-schema@0.7.8

## 0.6.0

### Minor Changes

## 0.5.2

### Patch Changes

## 0.5.1

### Patch Changes

## 0.5.0

### Minor Changes

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

## 0.1.1

### Patch Changes

## 0.1.0

### Minor Changes
