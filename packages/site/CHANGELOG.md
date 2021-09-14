# druxt-site

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
