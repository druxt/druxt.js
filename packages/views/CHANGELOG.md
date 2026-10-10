# druxt-views

## 0.23.0 - 2026-10-10

### Minor Changes

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Take axios 0.34.0, the current release of the 0.x line. ([`6998f56`](https://github.com/druxt/druxt.js/commit/6998f56d9d18abf0ea7d9d308366d79b7b938b80))
- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- A request that was already in flight when the cache was cleared no longer stores what it fetched before the clear. Clearing the cache because content changed in Drupal could leave the old content served for the rest of its lifetime. ([`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))
  The same holds for the client's JSON:API index and the store: an index or store request in flight during a clear is not kept, and a call made after the clear fetches afresh instead of joining it. The router, Views and menu stores drop a route, result or menu fetched before a flush in the same way.

  A route dropped that way is still the route being rendered, so it is now the active route even though the cache does not hold it. The page title, breadcrumb and block regions follow the page in front of the visitor instead of the one before it. `druxtRouter/setRoute` takes `{ path, route }` as well as a path, and a route the cache never stored, such as one behind a `500`, is now the active route where it used to leave the previous route in place.

- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Fixed a typo in the internal Vue `ref` name used for recursively-rendered. ([`7d560a6`](https://github.com/druxt/druxt.js/commit/7d560a67116d333dca9329557364e518e9e602cc))
  `attachments_before`/`attachments_after` view attachments. This is not part
  of the documented public API - the scoped slot names (`attachments_before`,
  `attachments_after`) were already spelled correctly and are unaffected - but
  if you have custom code reading `this.$refs` directly on a `DruxtView`
  instance for these attachment refs, verify the ref name still matches after
  upgrading.
- Updated dependencies: druxt-blocks@0.18.0, druxt@0.25.0, druxt-entity@0.29.0, druxt-router@0.32.0.

## 0.22.2 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt@0.23.0, druxt-blocks@0.17.3, druxt-entity@0.28.1, druxt-router@0.30.0.

## 0.22.1 - 2023-07-05

### Patch Changes

- Fixed issue with axios dependency. ([`400e4f8`](https://github.com/druxt/druxt.js/commit/400e4f8f))
- Updated dependencies: druxt-blocks@0.17.2.

## 0.22.0 - 2023-07-05

### Minor Changes

- Added druxt/views/flushResults mutation. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))
- Added bypassCache option to druxt/views/getResults action. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))
- Added bypassCache druxt setting to DruxtView component. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))

### Patch Changes

- Updated dependencies: druxt@0.22.0, druxt-entity@0.28.0, druxt-blocks@0.17.1, druxt-router@0.29.1.

## 0.21.0 - 2022-11-03

### Minor Changes

- Updated components to support the DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt-entity@0.27.0, druxt@0.21.0, druxt-router@0.29.0, druxt-blocks@0.17.0.

## 0.20.0 - 2022-08-12

### Minor Changes

- Added watch for 'arguments' prop. ([`2f2a7cc`](https://github.com/druxt/druxt.js/commit/2f2a7cce))

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt-router@0.28.0, druxt-blocks@0.16.3, druxt-entity@0.26.0, druxt@0.20.0.

## 0.19.1 - 2022-07-08

### Patch Changes

- Fixed undefined errors in DruxtView watch methods. ([`ffd9d54`](https://github.com/druxt/druxt.js/commit/ffd9d542))
- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3, druxt-entity@0.25.1, druxt-blocks@0.16.2, druxt-router@0.27.4.

## 0.19.0 - 2022-05-23

### Minor Changes

- Added langcode and prefix support to DruxtView component and Vuex store. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  ⚠ Potential breaking change

  ```diff
  - $store.state['druxt/views'].results.frontpage.page_1
  + $store.state['druxt/views'].results.frontpage.page_1[undefined]
  + $store.state['druxt/views'].results.frontpage.page_1.en
  + $store.state['druxt/views'].results.frontpage.page_1.es
  ```

- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added multilingual support to Views block components. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0, druxt-router@0.27.0, druxt-blocks@0.16.0, druxt-entity@0.25.0.

## 0.18.2 - 2022-04-14

### Patch Changes

- Fixed available component options. ([`c6d7c83`](https://github.com/druxt/druxt.js/commit/c6d7c83))
- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))
- Updated dependencies: druxt-blocks@0.15.2, druxt@0.18.2, druxt-entity@0.24.3.

## 0.18.1 - 2022-02-23

### Patch Changes

- Added support for the @nuxtjs/axios module. ([#63](https://github.com/druxt/druxt.js/issues/63), [`e3d5238`](https://github.com/druxt/druxt.js/commit/e3d5238c))
- Updated dependencies: druxt@0.18.0, druxt-blocks@0.15.1, druxt-entity@0.24.2, druxt-router@0.26.1.

## 0.18.0 - 2022-02-07

### Minor Changes

- Improved DruxtView storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Fixed errors in storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`d7e92b2`](https://github.com/druxt/druxt.js/commit/d7e92b2))
- Updated dependencies: druxt-router@0.26.0, druxt-blocks@0.15.0, druxt@0.17.0, druxt-entity@0.24.0.

## 0.17.2 - 2022-01-12

### Patch Changes

- Updated dependencies: druxt-entity@0.23.0, druxt-blocks@0.14.5.

## 0.17.1 - 2021-12-30

### Patch Changes

- Updated dependencies: druxt@0.16.0, druxt-entity@0.22.0, druxt-router@0.25.0, druxt-blocks@0.14.4.

## 0.17.0 - 2021-12-11

### Minor Changes

- Fixed DruxtViewsFilter render method. ([`7709ece`](https://github.com/druxt/druxt.js/commit/7709ece))

  ⚠ Potential breaking change

  _**Note:** This may change the markup of a Druxt View filter component._

### Patch Changes

- Updated dependencies: druxt@0.15.0, druxt-blocks@0.14.3, druxt-entity@0.21.4, druxt-router@0.24.2.

## 0.16.2 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0, druxt-blocks@0.14.2, druxt-entity@0.21.3, druxt-router@0.24.1.

## 0.16.1 - 2021-11-24

### Patch Changes

- Updated dependencies: druxt-router@0.24.0, druxt-blocks@0.14.1, druxt-entity@0.21.2.

## 0.16.0 - 2021-11-10

### Minor Changes

- Added API Proxy support. ([#362](https://github.com/druxt/druxt.js/issues/362), [`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204c))
- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Fixed issue with undefined wrapper in DruxtViewsFilter. ([`d80f5d4`](https://github.com/druxt/druxt.js/commit/d80f5d4))
- Updated dependencies: druxt-entity@0.21.0, druxt-blocks@0.14.0, druxt@0.13.0, druxt-router@0.23.0.

## 0.15.0 - 2021-10-10

### Minor Changes

- Added support for Contextual filters (arguments). ([`c769243`](https://github.com/druxt/druxt.js/commit/c769243))

  ```vue
  <DruxtView :arguments="[1, 2, 3]" displayid="block_1" view-id="articles_aside" />
  ```

### Patch Changes

- Updated dependencies: druxt@0.12.0, druxt-router@0.22.0, druxt-entity@0.20.0, druxt-blocks@0.13.1.

## 0.14.1 - 2021-09-29

### Patch Changes

- Fixed missing templates in package. ([`b9e5839`](https://github.com/druxt/druxt.js/commit/b9e5839))

## 0.14.0 - 2021-09-29

### Minor Changes

- Moved `$druxtViews` plugin settings to `$druxt.settings.views`. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Added module-level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Updated storybook integration. ([`8d28c18`](https://github.com/druxt/druxt.js/commit/8d28c18))

### Patch Changes

- Fixed errors when no props provided to component. ([`4da7fd3`](https://github.com/druxt/druxt.js/commit/4da7fd3))
- Updated dependencies: druxt-router@0.21.0, druxt-blocks@0.13.0, druxt-entity@0.19.0, druxt@0.11.0.

## 0.13.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))

### Patch Changes

- Fixed path to components in Storybook. ([`49454cb`](https://github.com/druxt/druxt.js/commit/49454cb))
- Updated dependencies: druxt-router@0.20.0, druxt-blocks@0.12.0, druxt@0.10.0, druxt-entity@0.18.0.

## 0.12.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))
- Updated dependencies: druxt-blocks@0.11.1, druxt-entity@0.17.1, druxt-router@0.19.1.

## 0.12.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtView } from 'druxt-views'
  +import DruxtView from 'druxt-views/dist/components/DruxtView.vue'
  ```

### Patch Changes

- Updated dependencies: druxt-blocks@0.11.0, druxt@0.9.0, druxt-entity@0.17.0, druxt-router@0.19.0.

## 0.11.0 - 2021-06-24

### Minor Changes

- Added support for default template injection.

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080---2021-06-20)

- Added ability to load by UUID or View ID.

## 0.10.0 - 2021-06-17

### Minor Changes

- Added empty content to results slot if no results.

## 0.9.3 - 2021-06-14

### Patch Changes

- Fixed issue with model filter forcing a refresh.

## 0.9.2 - 2021-06-12

### Patch Changes

- Added fetchKey to fix hydration issues.

## 0.9.1 - 2021-04-26

### Patch Changes

- Fixed issue with default view mode value.

## 0.9.0 - 2021-03-22

### Minor Changes

- Added ability to filter JSON:API fields.
- Refactored components to use DruxtModule.
- Fixed issues with Storybook integration.

## 0.8.3 - 2021-03-09

### Patch Changes

- Fixed missing attachment Views.

## 0.8.2 - 2021-03-08

### Patch Changes

- Fixed issues with Storybook integration.

## 0.8.1 - 2021-03-08

### Patch Changes

- Fixed issues with Storybook integration.
- Fixed missing attachments Views.

## 0.8.0 - 2021-03-06

### Minor Changes

- Added Storybook integration.
- Fixed broken View results.

## 0.7.2 - 2021-03-01

### Patch Changes

- Fixed broken View results.

## 0.7.1 - 2021-02-27

### Patch Changes

- Fixed deprecation notice.

## 0.7.0 - 2021-02-22

### Minor Changes

- Refactored module to use DruxtClient/DruxtStore.
- Added pagination.
- Added exposed sorts.
- Added exposed filters.
- Added Views Vuex store.

## 0.6.2 - 2021-01-29

### Patch Changes

- Fixed issue with View display data.

## 0.6.1 - 2021-01-08

### Patch Changes

- Updated dependencies.

## 0.6.0 - 2020-12-04

### Minor Changes

- Added DruxtRouter View component.
- Updated dependencies.

## 0.5.1 - 2020-11-14

### Patch Changes

- Updated dependencies.

## 0.5.0 - 2020-10-19

### Minor Changes

- Added support for DruxtComponentMixin.
- Updated dependencies.

## 0.4.2 - 2020-10-09

### Patch Changes

- Updated attachment_before/after slots.
- Updated dependencies.

## 0.4.1 - 2020-09-28

### Patch Changes

- Added attachment_before/after slots.

## 0.4.0 - 2020-09-01

### Minor Changes

## 0.3.0 - 2020-07-07

### Minor Changes

## 0.2.1 - 2020-06-16

### Patch Changes

## 0.2.0 - 2020-06-13

### Minor Changes

## 0.1.0 - 2020-06-05

### Initial release
