# druxt-blocks

## 0.11.1

### Patch Changes

- c4616df: Fixed dependencies
- Updated dependencies [c4616df]
  - druxt-entity@0.17.1
  - druxt-router@0.19.1

## 0.11.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtBlock } from 'druxt-blocks'
  +import DruxtBlock from 'druxt-blocks/dist/components/DruxtBlock.vue'
  ```

### Patch Changes

- Updated dependencies [21170fb]
  - druxt@0.9.0
  - druxt-entity@0.17.0
  - druxt-router@0.19.0

## 0.10.0

### Minor Changes

- Added support for default template injection
  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080)

## 0.9.2

### Patch Changes

- Additional hydration fixes

## 0.9.1

### Patch Changes

- Added fetchKey to fix hydration issues

## 0.9.0

### Minor Changes

- Added ability to load block by Drupal internal ID
- Added ability to filter block query fields
- Added Storybook integration
- Updated DruxtBlock and DruxtBlockRegion to use DruxtModule
- Updated documentation

## 0.8.1

### Patch Changes

- Fixed issue with incorrect sorting of blocks in DruxtBlockRegion component

## 0.8.0

### Minor Changes

- Added support for DruxtClient and DruxtStore

## 0.7.5

### Patch Changes

- Updated depedencies

## 0.7.4

### Patch Changes

- Updated depedencies

## 0.7.3

### Patch Changes

- Fixed class and style binding

## 0.7.2

### Patch Changes

- Added class and style binding

## 0.7.1

### Patch Changes

- Fixed issue with Block wrapper

## 0.7.0

### Minor Changes

- Added DruxtWrapper support to Block and BlockRegion components
- Removed support for DruxtCommonWrapper (deprecated)

## 0.6.1

### Patch Changes

- Updated dependencies

## 0.6.0

### Minor Changes

- Added scoped slots per block to BlockRegion component

  _**Example:** DruxtBlockRegion wrapper component with scoped slots_

  ```vue
  <template>
    <div>
      <slot :name="block_id" />
    </div>
  </template>
  ```

- Added support for DruxtCommonWrapper

## 0.5.0

### Minor Changes

- Refactored to use Nuxt fetch hook
- Updated dependencies

## 0.4.1

### Patch Changes

- Updated dependencies

## 0.4.0

### Minor Changes

- Added default Page Title block

## 0.3.0

### Minor Changes

- Added watch to update DruxtBlockRegion data on route change

## 0.2.0

### Minor Changes

- Added default Block Content entity block

## 0.1.0

### Initial release
