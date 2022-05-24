# druxt-blocks

## 0.16.1

### Patch Changes

- Version bump

## 0.16.0

### Minor Changes

- be21952: Added multilingual support to the DruxtBlock and DruxtBlockRegion component.

  example:

  ```jsx
  <DruxtBlockRegion name="header" theme="umami" langcode="es" />
  ```

- be21952: Add support for multilingual paths in DruxtBlockRegion.
- be21952: Added langcode to component mixins.

### Patch Changes

- Updated dependencies [be21952]
  - druxt@0.19.0
  - druxt-router@0.27.0
  - druxt-entity@0.25.0

## 0.15.2

### Patch Changes

- 540afca: Updated drupal-jsonapi-params to 2.0.0
- Updated dependencies [540afca]
  - druxt@0.18.2
  - druxt-entity@0.24.3

## 0.15.1

### Patch Changes

- Updated dependencies [e3d5238]
  - druxt@0.18.0
  - druxt-entity@0.24.2
  - druxt-router@0.26.1

## 0.15.0

### Minor Changes

- b79701c: Added detailed debug information for the DruxtBlock component.
- 1db9584: feat(#429): Added watch for `id` and `uuid` to the DruxtBlock component.
- b79701c: feat(#249): Improved DruxtBlock and DruxtBlockRegion storybook stories and documentation.
- 6d763ce: feat(#112): Added DruxtBlocksRegionMixin

  ```js
  import { DruxtBlocksRegionMixin } from "druxt-blocks";
  export default {
    mixins: [DruxtBlocksRegionMixin]
  };
  ```

- 34d8397: feat(#429): Added watch for `name` and `theme` to the DruxtBlockRegion component.

### Patch Changes

- d7e92b2: feat(#249): Fixed errors in storybook.
- Updated dependencies [b79701c]
  - druxt-router@0.26.0
  - druxt@0.17.0
  - druxt-entity@0.24.0

## 0.14.5

### Patch Changes

- Updated dependencies [60ee4e8]
  - druxt-entity@0.23.0

## 0.14.4

### Patch Changes

- Updated dependencies [7b749bd]
  - druxt@0.16.0
  - druxt-entity@0.22.0
  - druxt-router@0.25.0

## 0.14.3

### Patch Changes

- Updated dependencies [2ae1d6d]
  - druxt@0.15.0
  - druxt-entity@0.21.4
  - druxt-router@0.24.2

## 0.14.2

### Patch Changes

- Updated dependencies [45bc0b9]
  - druxt@0.14.0
  - druxt-entity@0.21.3
  - druxt-router@0.24.1

## 0.14.1

### Patch Changes

- Updated dependencies [9161b38]
  - druxt-router@0.24.0
  - druxt-entity@0.21.2

## 0.14.0

### Minor Changes

- e7b1533: Refactored DruxtModule fetch hooks

### Patch Changes

- Updated dependencies [025315a]
  - druxt-entity@0.21.0
  - druxt@0.13.0
  - druxt-router@0.23.0

## 0.13.1

### Patch Changes

- Updated dependencies [4504a2f]
  - druxt@0.12.0
  - druxt-router@0.22.0
  - druxt-entity@0.20.0

## 0.13.0

### Minor Changes

- dae345e: Moved `$druxtBlocks` plugin settings to `$druxt.settings.blocks`
- dae345e: Added module level options
- 8d28c18: Updated storybook integration

### Patch Changes

- Updated dependencies [9d905e8]
  - druxt-router@0.21.0
  - druxt-entity@0.19.0
  - druxt@0.11.0

## 0.12.0

### Minor Changes

- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook
- 2b8c3f3: Updated to use DruxtDebug component

### Patch Changes

- 49454cb: Fixed path to components in Storybook
- Updated dependencies [1ab762c]
  - druxt-router@0.20.0
  - druxt@0.10.0
  - druxt-entity@0.18.0

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
