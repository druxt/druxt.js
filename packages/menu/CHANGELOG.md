# druxt-menu

## 0.19.2

### Patch Changes

- 86c8235b: feat(#679): Adds Nuxt Auth Axios instance to the DruxtMenu plugin to ensure correct results are provided when authenticated.
- Updated dependencies [7664d90d]
  - druxt@0.24.0

## 0.19.1

### Patch Changes

- Updated dependencies [41cab3a0]
  - druxt@0.22.0
  - druxt-blocks@0.17.1

## 0.19.0

### Minor Changes

- f6b4a664: feat(#578): updated components to support the DruxtDevelTemplate tool.

### Patch Changes

- Updated dependencies [e46a3290]
  - druxt@0.21.0
  - druxt-blocks@0.17.0

## 0.18.0

### Minor Changes

- 33301873: feat(#539): Use JSON:API Menu Items data by default.
- 54c8ece3: Enabled dependencies when only using Nuxt druxt-menu module.

### Patch Changes

- fc811db3: Add DruxtModule props to component module stories.
- Updated dependencies [49b67872]
  - druxt-blocks@0.16.3
  - druxt@0.20.0

## 0.17.1

### Patch Changes

- 45e14b84: Fixed support for nuxt/storybook.
- Updated dependencies [352b7a51]
  - druxt@0.19.3
  - druxt-blocks@0.16.2

## 0.17.0

### Minor Changes

- be21952: Added multilingual support to the DruxtMenu component.

  example:

  ```jsx
  <DruxtMenu name="main" langcode="es" />
  ```

- be21952: Added langcode to component mixins.
- be21952: Added multilingual support to Block components.

### Patch Changes

- Updated dependencies [be21952]
  - druxt@0.19.0
  - druxt-blocks@0.16.0

## 0.16.3

### Patch Changes

- 540afca: Updated drupal-jsonapi-params to 2.0.0
- Updated dependencies [540afca]
  - druxt-blocks@0.15.2
  - druxt@0.18.2

## 0.16.2

### Patch Changes

- 35f439e: Fixed external menu links.
- Updated dependencies [80164a1]
  - druxt@0.18.1

## 0.16.1

### Patch Changes

- Updated dependencies [e3d5238]
  - druxt@0.18.0
  - druxt-blocks@0.15.1

## 0.16.0

### Minor Changes

- b79701c: feat(#249): Improved DruxtMenu storybook stories and documentation.

### Patch Changes

- Updated dependencies [b79701c]
  - druxt-blocks@0.15.0
  - druxt@0.17.0

## 0.15.3

### Patch Changes

- Updated dependencies [7b749bd]
  - druxt@0.16.0
  - druxt-blocks@0.14.4

## 0.15.2

### Patch Changes

- Updated dependencies [2ae1d6d]
  - druxt@0.15.0
  - druxt-blocks@0.14.3

## 0.15.1

### Patch Changes

- Updated dependencies [45bc0b9]
  - druxt@0.14.0
  - druxt-blocks@0.14.2

## 0.15.0

### Minor Changes

- e7b1533: Refactored DruxtModule fetch hooks

### Patch Changes

- Updated dependencies [77ab204]
  - druxt-blocks@0.14.0
  - druxt@0.13.0

## 0.14.3

### Patch Changes

- 631598d: Removed debug code

## 0.14.1

### Patch Changes

- ee15810: Fixed bug when menu endpoint fails
- Updated dependencies [4504a2f]
  - druxt@0.12.0
  - druxt-blocks@0.13.1

## 0.14.0

### Minor Changes

- dae345e: Added module level options
- 8d28c18: Updated storybook integration

### Patch Changes

- Updated dependencies [dae345e]
  - druxt-blocks@0.13.0
  - druxt@0.11.0

## 0.13.0

### Minor Changes

- 715e5ef: Updated component registration method to use the Nuxt `components:dirs` hook

### Patch Changes

- 49454cb: Fixed path to components in Storybook
- Updated dependencies [715e5ef]
  - druxt-blocks@0.12.0
  - druxt@0.10.0

## 0.12.1

### Patch Changes

- c4616df: Fixed dependencies
- Updated dependencies [c4616df]
  - druxt-blocks@0.11.1

## 0.12.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtMenu } from 'druxt-menu'
  +import DruxtMenu from 'druxt-menu/dist/components/DruxtMenu.vue'
  ```

### Patch Changes

- Updated dependencies [21170fb]
  - druxt-blocks@0.11.0
  - druxt@0.9.0

## 0.11.0

### Minor Changes

- Added support for default template injection

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080)

- Added support for v-model
- Updated dependencies

## 0.10.3

### Patch Changes

- Added fetchKey to fix hydration issue

## 0.10.2

### Patch Changes

- Fixed hydration issue

## 0.10.1

### Patch Changes

- Added parentId prop
- Fixed issue with missing \$attrs / propsData

## 0.10.0

### Minor Changes

- Refactored DruxtMenu component for DruxtModule
- Added ability to filter JSON:API fields

## 0.9.0

### Minor Changes

- Added Storybook integration
- Fixed bug with parent template

## 0.8.0

### Minor Changes

- Added support for DruxtClient and DruxtStore

## 0.7.0

### Minor Changes

- Added [DruxtMenuMixin](/api/packages/menu/mixins/menu)

## 0.6.2

### Patch Changes

- Updated dependencies

## 0.6.1

### Patch Changes

- Updated dependencies

## 0.6.0

### Minor Changes

- Updated DruxtMenu for Druxt component system
- Added \$attrs passthrough

## 0.5.0

### Minor Changes

- Improved support for JSON:API Menu Item subtrees
- Updated dependencies

## 0.4.0

### Minor Changes

## 0.3.0

### Minor Changes

## 0.2.0

### Minor Changes

## 0.1.1

### Patch Changes

## 0.1.0

### Initial release
