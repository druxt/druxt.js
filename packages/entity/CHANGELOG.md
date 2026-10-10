# druxt-entity

## 0.29.0 - 2026-10-10

### Minor Changes

- Removed deprecated entity component fields by default. ([#517](https://github.com/druxt/druxt.js/issues/517), [`8e4d246`](https://github.com/druxt/druxt.js/commit/8e4d24600a8c1c18db3fd7dc622e4ae6fa13762f))

### Patch Changes

- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Updated dependencies: druxt@0.25.0, druxt-router@0.32.0, druxt-schema@0.12.0.

## 0.28.1 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt@0.23.0, druxt-router@0.30.0, druxt-schema@0.11.3.

## 0.28.0 - 2023-07-05

### Minor Changes

- Added bypassCache druxt setting to DruxtEntity components. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))

### Patch Changes

- Updated dependencies: druxt@0.22.0, druxt-router@0.29.1, druxt-schema@0.11.2.

## 0.27.1 - 2023-05-15

### Patch Changes

- Added passthrough attrs to DruxtField. ([#632](https://github.com/druxt/druxt.js/issues/632), [`39af33a`](https://github.com/druxt/druxt.js/commit/39af33a4))

## 0.27.0 - 2022-11-03

### Minor Changes

- Updated missing schema/vue component message with DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt@0.21.0, druxt-router@0.29.0, druxt-schema@0.11.1.

## 0.26.1 - 2022-08-24

### Patch Changes

- Sanitised empty emitted strings, fixing themed text fields whose value became `true` when emptied. ([#552](https://github.com/druxt/druxt.js/issues/552), [`cc18581`](https://github.com/druxt/druxt.js/commit/cc185819))

## 0.26.0 - 2022-08-12

### Minor Changes

- Added watch for 'settings' prop. ([`2f2a7cc`](https://github.com/druxt/druxt.js/commit/2f2a7cce))

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt-router@0.28.0, druxt@0.20.0, druxt-schema@0.11.0.

## 0.25.1 - 2022-07-08

### Patch Changes

- Fixed bug with DruxtEntity Storybook and unpublished content. ([`28bed4c`](https://github.com/druxt/druxt.js/commit/28bed4ca))
- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3, druxt-router@0.27.4.

## 0.25.0 - 2022-05-23

### Minor Changes

- Added **langcode** prop to DruxtEntity and DruxtField components for multilingual support. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  example:

  ```jsx
  <DruxtEntity type="node--recipe" uuid="16268720-a0fa-4243-8bdc-491d8857eb26" langcode="es" />
  ```

- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0, druxt-router@0.27.0, druxt-schema@0.10.4.

## 0.24.3 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))
- Updated dependencies: druxt@0.18.2, druxt-schema@0.10.3.

## 0.24.2 - 2022-02-23

### Patch Changes

- Updated dependencies: druxt-schema@0.10.2, druxt@0.18.0, druxt-router@0.26.1.

## 0.24.1 - 2022-02-10

### Patch Changes

- Fixed DruxtEntity and DruxtEntityForm stories. ([#438](https://github.com/druxt/druxt.js/issues/438), [`d65eb40`](https://github.com/druxt/druxt.js/commit/d65eb40))

## 0.24.0 - 2022-02-07

### Minor Changes

- Improved DruxtEntity and DruxtEntityForm storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Fixed errors in storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`d7e92b2`](https://github.com/druxt/druxt.js/commit/d7e92b2))
- Updated dependencies: druxt-router@0.26.0, druxt@0.17.0, druxt-schema@0.10.1.

## 0.23.0 - 2022-01-12

### Minor Changes

- Updated DruxtRouterEntity to use Full view mode. ([`87ec487`](https://github.com/druxt/druxt.js/commit/87ec487))

  ⚠ Potential breaking change

  _**Note:** This may effect the rendered template if the Full view mode is configured in Drupal._

  ```diff
  -components/DruxtEntityNodePageDefault.vue
  +components/DruxtEntityNodePageFull.vue
  -components/druxt/entity/node/page/Default.vue
  +components/druxt/entity/node/page/Full.vue
  ```

- Added DruxtEntity[EntityType][viewmode][SchemaType] component options. ([`60ee4e8`](https://github.com/druxt/druxt.js/commit/60ee4e8))

### Patch Changes

- Updated dependencies: druxt-schema@0.10.0.

## 0.22.0 - 2021-12-30

### Minor Changes

- Updated DruxtEntityForm error handling. ([`7b749bd`](https://github.com/druxt/druxt.js/commit/7b749bd))

### Patch Changes

- Updated dependencies: druxt@0.16.0, druxt-router@0.25.0, druxt-schema@0.9.3.

## 0.21.4 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0, druxt-router@0.24.2, druxt-schema@0.9.2.

## 0.21.3 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0, druxt-router@0.24.1, druxt-schema@0.9.1.

## 0.21.2 - 2021-11-24

### Patch Changes

- Updated dependencies: druxt-router@0.24.0.

## 0.21.1 - 2021-11-17

### Patch Changes

- Fixed Vuex mutation error. ([`6ade3a2`](https://github.com/druxt/druxt.js/commit/6ade3a2))

## 0.21.0 - 2021-11-10

### Minor Changes

- Added API Proxy support. ([#362](https://github.com/druxt/druxt.js/issues/362), [`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204c))
- Added **include** option and the ability to filter related resources. ([`025315a`](https://github.com/druxt/druxt.js/commit/025315a))

  ```js
  export default {
    druxt: {
      query: {
        include: ['field_media_image', 'field_media_image.field_media_image'],
        fields: [
          ['file--file', ['uri']],
          ['media--image', []],
        ],
      },
    },
  };
  ```

- Added **settings** property to the DruxtEntity and DruxtEntityForm components. ([`025315a`](https://github.com/druxt/druxt.js/commit/025315a))

  ```vue
  <template>
    <DruxtEntity :settings="{ query: { include: ['uid'] } }" type="node--page" :uuid="uuid" />
  </template>
  ```

- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Updated dependencies: druxt-schema@0.9.0, druxt@0.13.0, druxt-router@0.23.0.

## 0.20.0 - 2021-10-10

### Minor Changes

- Updated DruxtEntityForm to use new DruxtClient methods. ([`897dcbc`](https://github.com/druxt/druxt.js/commit/897dcbc))

### Patch Changes

- Updated dependencies: druxt@0.12.0, druxt-router@0.22.0, druxt-schema@0.8.1.

## 0.19.0 - 2021-09-29

### Minor Changes

- Added module-level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Updated storybook integration. ([`8d28c18`](https://github.com/druxt/druxt.js/commit/8d28c18))
- Moved `$druxtEntity` plugin settings to `$druxt.settings.entity`. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))

### Patch Changes

- Updated dependencies: druxt-router@0.21.0, druxt-schema@0.8.0, druxt@0.11.0.

## 0.18.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))
- Updated to use DruxtDebug component. ([`2b8c3f3`](https://github.com/druxt/druxt.js/commit/2b8c3f3))

### Patch Changes

- Fixed path to components in Storybook. ([`49454cb`](https://github.com/druxt/druxt.js/commit/49454cb))
- Updated dependencies: druxt-router@0.20.0, druxt@0.10.0, druxt-schema@0.7.10.

## 0.17.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))
- Updated dependencies: druxt-router@0.19.1, druxt-schema@0.7.9.

## 0.17.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtEntity } from 'druxt-entity'
  +import DruxtEntity from 'druxt-entity/dist/components/DruxtEntity.vue'
  ```

### Patch Changes

- Updated dependencies: druxt@0.9.0, druxt-router@0.19.0, druxt-schema@0.7.8.

## 0.16.0 - 2021-07-04

### Minor Changes

- Added support for default template injection.

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080---2021-06-20)

- Added support for schema-less entities.
- Added improved defaults to the DruxtField component.
- Deprecated DruxtField default field components.

  The components can be tree shaken with the following setting in `nuxt.config.js`:

  ```js
  module.exports = {
    druxt: {
      entity: {
        components: {
          fields: false,
        },
      },
    },
  };
  ```

## 0.15.0 - 2021-06-18

### Minor Changes

- Fixed issue with EntityReferenceLabel component.
- Added watch to update DruxtEntity data on props change.
- Updated components v-model support.
- Updated Storybook integration.
- Updated dependencies.

## 0.14.2 - 2021-06-13

### Patch Changes

- Updated fetchKey.

## 0.14.1 - 2021-06-12

### Patch Changes

- Added custom fetchKey to fix hydration issues.

## 0.14.0 - 2021-05-06

### Minor Changes

- Added v-model support for DruxtEntity/DruxtEntityForm components.

  ```vue
  <template>
    <DruxtEntity v-model="entity" />
    <DruxtEntityForm v-model="entity" />
  </template>
  ```

## 0.13.0 - 2021-04-22

### Minor Changes

- Added DruxtEntityForm component.

  ```vue
  <DruxtEntityForm type="node--page" @submit="onSubmit" @error="onError" />
  ```

  - For more details, refer to the [DruxtEntityForm API documentation](/api/packages/entity/components/DruxtEntityForm)

## 0.12.0 - 2021-03-15

### Minor Changes

- Added ability to filter JSON:API fields.
- Updated Storybook integration.

## 0.11.2 - 2021-03-06

### Patch Changes

- Fixed issue with Storybook integration.
- Updated Storybook integration.

## 0.11.1 - 2021-03-04

### Patch Changes

- Fixed issue with Storybook integration.

## 0.11.0 - 2021-03-02

### Minor Changes

- Added DruxtEntity Storybook integration.
- Updated dependencies.

## 0.10.1 - 2021-02-28

### Patch Changes

- Added TextSummaryOrTrimmed field.
- Added TextTrimmed field.
- Updated dependencies.

## 0.10.0 - 2021-02-10

### Minor Changes

- Refactored module to use DruxtClient/DruxtStore.

## 0.9.0 - 2021-01-12

### Minor Changes

- Added support for Entity reference view mode.
- Added ability to passthrough \$attrs.

## 0.8.1 - 2021-01-07

### Patch Changes

- Updated dependencies.

## 0.8.0 - 2020-12-04

### Minor Changes

- Added DruxtRouter Entity component.
- Updated dependencies.

## 0.7.2 - 2020-11-14

### Patch Changes

- Updated dependencies.

## 0.7.1 - 2020-10-24

### Patch Changes

- Updated DruxtEntity for DruxtComponentMixin.
- Updated Field component mixins.
- Updated dependencies.

## 0.7.0 - 2020-10-23

### Minor Changes

- Updated DruxtEntity for DruxtComponentMixin.

## 0.6.3 - 2020-10-14

### Patch Changes

- Fixed issue with images and HMR.

## 0.6.2 - 2020-10-09

### Patch Changes

- Fixed issue with `internal:` links.
- Updated dependencies.

## 0.6.1 - 2020-08-29

### Patch Changes

- Updated dependencies.

## 0.6.0 - 2020-08-27

### Minor Changes

- Refactored to use Nuxt fetch hook.

## 0.5.2 - 2020-08-06

### Patch Changes

- Updated documentation.

## 0.5.1 - 2020-07-02

### Patch Changes

- Added support for UUIDs in component suggestions.

## 0.5.0 - 2020-06-29

### Minor Changes

- Added isEmpty method.
- Added FileDefault and Image fields.
- Added mode to EntityReferenceEntityView field.
- Added component suggestion system.
- Added context mixin.

## 0.4.0 - 2020-06-22

### Minor Changes

- Updated Field and label system.
- Updated Entity suggestions.

## 0.3.1 - 2020-06-14

### Patch Changes

- Added named slots for fields.

## 0.3.0 - 2020-06-13

### Minor Changes

- Added view mode suggestions.
- Added field id suggestions.

## 0.2.2 - 2020-05-31

### Patch Changes

- Fixed issues with EntityReferenceLabel field.
- Updated NumberInteger field.

## 0.2.1 - 2020-05-30

### Patch Changes

- Added BasicString field.
- Added Timestamp field.
- Fixed issue with ReferenceLabel field.
- Fixed empty field filter.

## 0.2.0 - 2020-05-29

### Minor Changes

- Added better multivalue field support.
- Added ResponsiveImage field.
- Added EntityReferenceEntityView field.
- Added NumberInteger field.
- Added EntityReferenceRevisionsEntityView field.
- Added ListDefault field.
- Added Link field.
- Added DatetimeDefault field.
- Updated dependencies.

## 0.1.0 - 2020-05-21

### Initial release
