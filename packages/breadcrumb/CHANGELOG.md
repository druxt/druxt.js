# druxt-breadcrumb

## 0.18.0 - 2026-10-10

### Minor Changes

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Updated dependencies: druxt-blocks@0.18.0, druxt@0.25.0, druxt-router@0.32.0.

## 0.17.2 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt@0.23.0, druxt-blocks@0.17.3, druxt-router@0.30.0.

## 0.17.1 - 2023-07-05

### Patch Changes

- Updated dependencies: druxt@0.22.0, druxt-blocks@0.17.1, druxt-router@0.29.1.

## 0.17.0 - 2022-11-03

### Minor Changes

- Updated component to support the DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt@0.21.0, druxt-router@0.29.0, druxt-blocks@0.17.0.

## 0.16.0 - 2022-08-12

### Minor Changes

- Enabled dependencies when only using Nuxt druxt-breadcrumb module. ([`54c8ece`](https://github.com/druxt/druxt.js/commit/54c8ece3))
- Fixed issue with multiple Home crumbs on multilingual sites. ([#538](https://github.com/druxt/druxt.js/issues/538), [`fa5164d`](https://github.com/druxt/druxt.js/commit/fa5164d4))

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt-router@0.28.0, druxt-blocks@0.16.3, druxt@0.20.0.

## 0.15.1 - 2022-07-08

### Patch Changes

- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3, druxt-blocks@0.16.2, druxt-router@0.27.4.

## 0.15.0 - 2022-05-23

### Minor Changes

- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added multilingual support to Breadcrumb Block component. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Removed duplicate Home crumb when using a multilingual backend. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0, druxt-router@0.27.0, druxt-blocks@0.16.0.

## 0.14.1 - 2022-02-23

### Patch Changes

- Updated dependencies: druxt@0.18.0, druxt-blocks@0.15.1, druxt-router@0.26.1.

## 0.14.0 - 2022-02-07

### Minor Changes

- Improved DruxtBreadcrumb storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added path prop to DruxtBreadcrumb component. ([#433](https://github.com/druxt/druxt.js/issues/433), [`0436de4`](https://github.com/druxt/druxt.js/commit/0436de4))

  ```vue
  <DruxtBreadcrumb path="/node/1" />
  ```

- Added watch for `home` and `path` to the DruxtBreadcrumb component. ([#429](https://github.com/druxt/druxt.js/issues/429), [`e2b8500`](https://github.com/druxt/druxt.js/commit/e2b8500))

### Patch Changes

- Updated dependencies: druxt-router@0.26.0, druxt-blocks@0.15.0, druxt@0.17.0.

## 0.13.4 - 2021-12-30

### Patch Changes

- Updated dependencies: druxt@0.16.0, druxt-router@0.25.0, druxt-blocks@0.14.4.

## 0.13.3 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0, druxt-blocks@0.14.3, druxt-router@0.24.2.

## 0.13.2 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0, druxt-blocks@0.14.2, druxt-router@0.24.1.

## 0.13.1 - 2021-11-24

### Patch Changes

- Updated dependencies: druxt-router@0.24.0, druxt-blocks@0.14.1.

## 0.13.0 - 2021-11-10

### Minor Changes

- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Updated dependencies: druxt-blocks@0.14.0, druxt@0.13.0, druxt-router@0.23.0.

## 0.12.1 - 2021-10-10

### Patch Changes

- Updated dependencies: druxt@0.12.0, druxt-router@0.22.0, druxt-blocks@0.13.1.

## 0.12.0 - 2021-09-29

### Minor Changes

- Updated storybook integration. ([`8d28c18`](https://github.com/druxt/druxt.js/commit/8d28c18))

### Patch Changes

- Fixed error when no crumbs are present. ([`9a1d720`](https://github.com/druxt/druxt.js/commit/9a1d720))
- Removed unused `$druxtBreadcrumb` plugin. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Updated dependencies: druxt-router@0.21.0, druxt-blocks@0.13.0, druxt@0.11.0.

## 0.11.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))

### Patch Changes

- Updated dependencies: druxt-router@0.20.0, druxt-blocks@0.12.0, druxt@0.10.0.

## 0.10.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))
- Updated dependencies: druxt-blocks@0.11.1, druxt-router@0.19.1.

## 0.10.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtBreadcrumb } from 'druxt-breadcrumb'
  +import DruxtBreadcrumb from 'druxt-breadcrumb/dist/components/DruxtBreadcrumb.vue'
  ```

### Patch Changes

- Updated dependencies: druxt-blocks@0.11.0, druxt@0.9.0, druxt-router@0.19.0.

## 0.9.0 - 2021-07-06

### Minor Changes

- Added support for default template injection.
  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080---2021-06-20)

## 0.8.0 - 2021-06-07

### Minor Changes

- Updated component to use DruxtModule.

## 0.7.2 - 2021-02-27

### Patch Changes

- Updated dependencies.

## 0.7.1 - 2021-01-07

### Patch Changes

- Updated dependencies.

## 0.7.0 - 2020-11-15

### Minor Changes

- Added support for the Druxt component.

## 0.6.1 - 2020-11-15

### Patch Changes

- Updated dependencies.

## 0.6.0 - 2020-09-03

### Minor Changes

- Refactored module.

## 0.5.0 - 2020-07-09

### Minor Changes

## 0.4.0 - 2020-06-05

### Minor Changes

## 0.3.2 - 2020-05-31

### Patch Changes

## 0.3.1 - 2020-04-01

### Patch Changes

## 0.3.0 - 2020-04-01

### Minor Changes

## 0.2.0 - 2020-03-26

### Minor Changes

## 0.1.1 - 2020-03-26

### Patch Changes

## 0.1.0 - 2020-03-26

### Minor Changes
