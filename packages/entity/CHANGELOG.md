# druxt-entity

## 0.17.1

### Patch Changes

- c4616df: Fixed dependencies
- Updated dependencies [c4616df]
  - druxt-router@0.19.1
  - druxt-schema@0.7.9

## 0.17.0

### Minor Changes

- 21170fb: Moved Vue components out of bundle

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtEntity } from 'druxt-entity'
  +import DruxtEntity from 'druxt-entity/dist/components/DruxtEntity.vue'
  ```

### Patch Changes

- Updated dependencies [21170fb]
  - druxt@0.9.0
  - druxt-router@0.19.0
  - druxt-schema@0.7.8

## 0.16.0

### Minor Changes

- Added support for default template injection

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080)

- Added support for schema-less entities
- Added improved defaults to the DruxtField component
- Deprecated DruxtField default field components

  The components can be tree shaken with the following setting in `nuxt.config.js`:

  ```js
  module.exports = {
    druxt: {
      entity: {
        components: {
          fields: false
        }
      }
    }
  };
  ```

## 0.15.0

### Minor Changes

- Fixed issue with EntityReferenceLabel component
- Added watch to update DeruxtEntity data on props change
- Updated components v-model support
- Updated Storybook integration
- Updated dependencies

## 0.14.2

### Patch Changes

- Updated fetchKey

## 0.14.1

### Patch Changes

- Added custom fetchKey to fix hydration issues

## 0.14.0

### Minor Changes

- Added v-model support for DruxtEntity/DruxtEntityForm components

  ```vue
  <template>
    <DruxtEntity v-model="entity" />
    <DruxtEntityForm v-model="entity" />
  </template>
  ```

## 0.13.0

### Minor Changes

- Added DruxtEntityForm component

  ```vue
  <DruxtEntityForm type="node--page" @submit="onSubmit" @error="onError" />
  ```

  - For more details, refer to the [DruxtEntityForm API documentation](/api/packages/entity/components/DruxtEntityForm)

## 0.12.0

### Minor Changes

- Added ability to filter JSON:API fields
- Updated Storybook integration

## 0.11.2

### Patch Changes

- Fixed issue with Storybook intergration
- Updated Storybook integration

## 0.11.1

### Patch Changes

- Fixed issue with Storybook intergration

## 0.11.0

### Minor Changes

- Added DruxtEntity Storybook integration
- Updated dependencies

## 0.10.1

### Patch Changes

- Added TextSummaryOrTrimmed field
- Added TextTrimmed field
- Updated dependencies

## 0.10.0

### Minor Changes

- Refactored module to use DruxtClient/DruxtStore

## 0.9.0

### Minor Changes

- Added support for Entity reference view mode
- Add ability to passthrough \$attrs

## 0.8.1

### Patch Changes

- Updated dependencies

## 0.8.0

### Minor Changes

- Added DruxtRouter Entity component
- Updated dependencies

## 0.7.2

### Patch Changes

- Updated dependencies

## 0.7.1

### Patch Changes

- Updated DruxtEntity for DruxtComponentMixin
- Updatd Field component mixins
- Updated dependencies

## 0.7.0

### Minor Changes

- Updated DruxtEntity for DruxtComponentMixin

## 0.6.3

### Patch Changes

- Fixed issue with images and HMR

## 0.6.2

### Patch Changes

- Fixed issue with `internal:` links
- Updated dependencies

## 0.6.1

### Patch Changes

- Updated dependencies

## 0.6.0

### Minor Changes

- Refactored to use Nuxt fetch hook

## 0.5.2

### Patch Changes

- Updated documentation

## 0.5.1

### Patch Changes

- Added support for UUIDs in component suggestions

## 0.5.0

### Minor Changes

- Added isEmpty method
- Added FileDefault and Image fields
- Added mode to EntityReferenceEntityView field
- Added component suggestion system
- Added context mixin

## 0.4.0

### Minor Changes

- Update Field and label system
- Updated Entity suggestions

## 0.3.1

### Patch Changes

- Added named slots for fields

## 0.3.0

### Minor Changes

- Added view mode suggestions
- Added field id suggestions

## 0.2.2

### Patch Changes

- Fixed issues with EntityReferenceLabel field
- Updated NuberInteger field

## 0.2.1

### Patch Changes

- Added BasicString field
- Added Timestamp field
- Fixed issue with ReferenceLabel field
- Fixed empty field filter

## 0.2.0

### Minor Changes

- Added better multivalue field support
- Added ResponsiveImage field
- Added EntityReferenceEntityView field
- Added NumberInteger field
- Added EntityReferenceRevisionsEntityView field
- Added ListDefault field
- Added Link field
- Added DatetimeDefault field
- Updated dependencies

## 0.1.0

### Initial release
