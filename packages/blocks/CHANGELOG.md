# druxt-blocks

## 0.18.0 - 2026-10-10

### Minor Changes

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Take axios 0.34.0, the current release of the 0.x line. ([`6998f56`](https://github.com/druxt/druxt.js/commit/6998f56d9d18abf0ea7d9d308366d79b7b938b80))
- A block content block whose resource is not in the store, or was flushed from it, renders nothing instead of throwing during render. It threw whenever the store lacked the entry, so a cache clear while the block was on the page emptied it for good. ([`ad82c1f`](https://github.com/druxt/druxt.js/commit/ad82c1f231765d22148ba2df08bc7ee2ccdbf52c))
- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Updated dependencies: druxt@0.25.0.

## 0.17.3 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt@0.23.0, druxt-entity@0.28.1, druxt-router@0.30.0.

## 0.17.2 - 2023-07-05

### Patch Changes

- Fixed issue with axios dependency. ([`400e4f8`](https://github.com/druxt/druxt.js/commit/400e4f8f))

## 0.17.1 - 2023-07-05

### Patch Changes

- Updated dependencies: druxt@0.22.0, druxt-entity@0.28.0, druxt-router@0.29.1.

## 0.17.0 - 2022-11-03

### Minor Changes

- Added Vue devtools integration. ([#583](https://github.com/druxt/druxt.js/issues/583), [`29905ff`](https://github.com/druxt/druxt.js/commit/29905ff6))
- Updated missing vue component message with DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt-entity@0.27.0, druxt@0.21.0, druxt-router@0.29.0.

## 0.16.3 - 2022-08-12

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt-router@0.28.0, druxt-entity@0.26.0, druxt@0.20.0.

## 0.16.2 - 2022-07-08

### Patch Changes

- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3, druxt-entity@0.25.1, druxt-router@0.27.4.

## 0.16.1 - 2022-05-24

### Patch Changes

- Version bump.

## 0.16.0 - 2022-05-23

### Minor Changes

- Added multilingual support to the DruxtBlock and DruxtBlockRegion component. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  example:

  ```jsx
  <DruxtBlockRegion name="header" theme="umami" langcode="es" />
  ```

- Added support for multilingual paths in DruxtBlockRegion. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0, druxt-router@0.27.0, druxt-entity@0.25.0.

## 0.15.2 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))
- Updated dependencies: druxt@0.18.2, druxt-entity@0.24.3.

## 0.15.1 - 2022-02-23

### Patch Changes

- Updated dependencies: druxt@0.18.0, druxt-entity@0.24.2, druxt-router@0.26.1.

## 0.15.0 - 2022-02-07

### Minor Changes

- Added detailed debug information for the DruxtBlock component. ([`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added watch for `id` and `uuid` to the DruxtBlock component. ([#429](https://github.com/druxt/druxt.js/issues/429), [`1db9584`](https://github.com/druxt/druxt.js/commit/1db9584))
- Improved DruxtBlock and DruxtBlockRegion storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added DruxtBlocksRegionMixin. ([#112](https://github.com/druxt/druxt.js/issues/112), [`6d763ce`](https://github.com/druxt/druxt.js/commit/6d763ce))

  ```js
  import { DruxtBlocksRegionMixin } from 'druxt-blocks';
  export default {
    mixins: [DruxtBlocksRegionMixin],
  };
  ```

- Added watch for `name` and `theme` to the DruxtBlockRegion component. ([#429](https://github.com/druxt/druxt.js/issues/429), [`34d8397`](https://github.com/druxt/druxt.js/commit/34d8397))

### Patch Changes

- Fixed errors in storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`d7e92b2`](https://github.com/druxt/druxt.js/commit/d7e92b2))
- Updated dependencies: druxt-router@0.26.0, druxt@0.17.0, druxt-entity@0.24.0.

## 0.14.5 - 2022-01-12

### Patch Changes

- Updated dependencies: druxt-entity@0.23.0.

## 0.14.4 - 2021-12-30

### Patch Changes

- Updated dependencies: druxt@0.16.0, druxt-entity@0.22.0, druxt-router@0.25.0.

## 0.14.3 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0, druxt-entity@0.21.4, druxt-router@0.24.2.

## 0.14.2 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0, druxt-entity@0.21.3, druxt-router@0.24.1.

## 0.14.1 - 2021-11-24

### Patch Changes

- Updated dependencies: druxt-router@0.24.0, druxt-entity@0.21.2.

## 0.14.0 - 2021-11-10

### Minor Changes

- Added API Proxy support. ([#362](https://github.com/druxt/druxt.js/issues/362), [`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204c))
- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Updated dependencies: druxt-entity@0.21.0, druxt@0.13.0, druxt-router@0.23.0.

## 0.13.1 - 2021-10-10

### Patch Changes

- Updated dependencies: druxt@0.12.0, druxt-router@0.22.0, druxt-entity@0.20.0.

## 0.13.0 - 2021-09-29

### Minor Changes

- Moved `$druxtBlocks` plugin settings to `$druxt.settings.blocks`. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Added module-level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Updated storybook integration. ([`8d28c18`](https://github.com/druxt/druxt.js/commit/8d28c18))

### Patch Changes

- Updated dependencies: druxt-router@0.21.0, druxt-entity@0.19.0, druxt@0.11.0.

## 0.12.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))
- Updated to use DruxtDebug component. ([`2b8c3f3`](https://github.com/druxt/druxt.js/commit/2b8c3f3))

### Patch Changes

- Fixed path to components in Storybook. ([`49454cb`](https://github.com/druxt/druxt.js/commit/49454cb))
- Updated dependencies: druxt-router@0.20.0, druxt@0.10.0, druxt-entity@0.18.0.

## 0.11.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))
- Updated dependencies: druxt-entity@0.17.1, druxt-router@0.19.1.

## 0.11.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtBlock } from 'druxt-blocks'
  +import DruxtBlock from 'druxt-blocks/dist/components/DruxtBlock.vue'
  ```

### Patch Changes

- Updated dependencies: druxt@0.9.0, druxt-entity@0.17.0, druxt-router@0.19.0.

## 0.10.0 - 2021-07-06

### Minor Changes

- Added support for default template injection.
  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080---2021-06-20)

## 0.9.2 - 2021-06-16

### Patch Changes

- Additional hydration fixes.

## 0.9.1 - 2021-06-12

### Patch Changes

- Added fetchKey to fix hydration issues.

## 0.9.0 - 2021-06-06

### Minor Changes

- Added ability to load block by Drupal internal ID.
- Added ability to filter block query fields.
- Added Storybook integration.
- Updated DruxtBlock and DruxtBlockRegion to use DruxtModule.
- Updated documentation.

## 0.8.1 - 2021-05-02

### Patch Changes

- Fixed issue with incorrect sorting of blocks in DruxtBlockRegion component.

## 0.8.0 - 2021-02-10

### Minor Changes

- Added support for DruxtClient and DruxtStore.

## 0.7.5 - 2021-01-07

### Patch Changes

- Updated dependencies.

## 0.7.4 - 2020-11-14

### Patch Changes

- Updated dependencies.

## 0.7.3 - 2020-10-25

### Patch Changes

- Fixed class and style binding.

## 0.7.2 - 2020-10-23

### Patch Changes

- Added class and style binding.

## 0.7.1 - 2020-10-17

### Patch Changes

- Fixed issue with Block wrapper.

## 0.7.0 - 2020-10-16

### Minor Changes

- Added DruxtWrapper support to Block and BlockRegion components.
- Removed support for DruxtCommonWrapper (deprecated).

## 0.6.1 - 2020-10-09

### Patch Changes

- Updated dependencies.

## 0.6.0 - 2020-09-08

### Minor Changes

- Added scoped slots per block to BlockRegion component.

  _**Example:** DruxtBlockRegion wrapper component with scoped slots_

  ```vue
  <template>
    <div>
      <slot :name="block_id" />
    </div>
  </template>
  ```

- Added support for DruxtCommonWrapper.

## 0.5.0 - 2020-08-30

### Minor Changes

- Refactored to use Nuxt fetch hook.
- Updated dependencies.

## 0.4.1 - 2020-08-20

### Patch Changes

- Updated dependencies.

## 0.4.0 - 2020-07-09

### Minor Changes

- Added default Page Title block.

## 0.3.0 - 2020-07-07

### Minor Changes

- Added watch to update DruxtBlockRegion data on route change.

## 0.2.0 - 2020-07-02

### Minor Changes

- Added default Block Content entity block.

## 0.1.0 - 2020-07-02

### Initial release
