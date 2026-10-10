# druxt-site

## 0.15.0 - 2026-10-10

### Minor Changes

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Updated dependencies: druxt-blocks@0.18.0, druxt-views@0.23.0, druxt@0.25.0, druxt-breadcrumb@0.18.0, druxt-entity@0.29.0, druxt-menu@0.22.0, druxt-router@0.32.0, druxt-schema@0.12.0.

## 0.14.3 - 2024-01-08

### Patch Changes

- Updated dependencies: druxt-menu@0.21.0.

## 0.14.2 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt-menu@0.20.0.

## 0.14.1 - 2023-07-05

### Patch Changes

- Updated dependencies: druxt-views@0.22.0, druxt@0.22.0, druxt-entity@0.28.0, druxt-blocks@0.17.1, druxt-breadcrumb@0.17.1, druxt-menu@0.19.1, druxt-router@0.29.1, druxt-schema@0.11.2.

## 0.14.0 - 2022-11-03

### Minor Changes

- Updated component to support the DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt-entity@0.27.0, druxt-views@0.21.0, druxt@0.21.0, druxt-menu@0.19.0, druxt-router@0.29.0, druxt-breadcrumb@0.17.0, druxt-blocks@0.17.0, druxt-schema@0.11.1.

## 0.13.0 - 2022-08-12

### Minor Changes

- Changed the default menu data source to the JSON:API Menu Items module. ([#539](https://github.com/druxt/druxt.js/issues/539), [`3330187`](https://github.com/druxt/druxt.js/commit/33301873))
- Added watch for 'theme' prop. ([`2f2a7cc`](https://github.com/druxt/druxt.js/commit/2f2a7cce))

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt-menu@0.18.0, druxt-router@0.28.0, druxt-blocks@0.16.3, druxt-breadcrumb@0.16.0, druxt-entity@0.26.0, druxt-views@0.20.0, druxt@0.20.0, druxt-schema@0.11.0.

## 0.12.1 - 2022-07-08

### Patch Changes

- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3, druxt-entity@0.25.1, druxt-views@0.19.1, druxt-blocks@0.16.2, druxt-breadcrumb@0.15.1, druxt-menu@0.17.1, druxt-router@0.27.4.

## 0.12.0 - 2022-05-23

### Minor Changes

- Added out-of-the-box multilingual support. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0, druxt-router@0.27.0, druxt-blocks@0.16.0, druxt-menu@0.17.0, druxt-entity@0.25.0, druxt-breadcrumb@0.15.0, druxt-views@0.19.0, druxt-schema@0.10.4.

## 0.11.2 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))
- Updated dependencies: druxt-views@0.18.2, druxt-blocks@0.15.2, druxt@0.18.2, druxt-entity@0.24.3, druxt-menu@0.16.3, druxt-schema@0.10.3.

## 0.11.1 - 2022-02-23

### Patch Changes

- Updated dependencies: druxt-schema@0.10.2, druxt@0.18.0, druxt-blocks@0.15.1, druxt-breadcrumb@0.14.1, druxt-entity@0.24.2, druxt-menu@0.16.1, druxt-router@0.26.1, druxt-views@0.18.1.

## 0.11.0 - 2022-02-07

### Minor Changes

- Improved DruxtSite storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Updated dependencies: druxt-router@0.26.0, druxt-blocks@0.15.0, druxt@0.17.0, druxt-views@0.18.0, druxt-menu@0.16.0, druxt-entity@0.24.0, druxt-breadcrumb@0.14.0, druxt-schema@0.10.1.

## 0.10.5 - 2022-01-12

### Patch Changes

- Updated dependencies: druxt-schema@0.10.0, druxt-entity@0.23.0, druxt-blocks@0.14.5, druxt-views@0.17.2.

## 0.10.4 - 2021-12-30

### Patch Changes

- Updated dependencies: druxt@0.16.0, druxt-entity@0.22.0, druxt-router@0.25.0, druxt-blocks@0.14.4, druxt-breadcrumb@0.13.4, druxt-menu@0.15.3, druxt-schema@0.9.3, druxt-views@0.17.1.

## 0.10.3 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0, druxt-views@0.17.0, druxt-blocks@0.14.3, druxt-breadcrumb@0.13.3, druxt-entity@0.21.4, druxt-menu@0.15.2, druxt-router@0.24.2, druxt-schema@0.9.2.

## 0.10.2 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0, druxt-blocks@0.14.2, druxt-breadcrumb@0.13.2, druxt-entity@0.21.3, druxt-menu@0.15.1, druxt-router@0.24.1, druxt-schema@0.9.1, druxt-views@0.16.2.

## 0.10.1 - 2021-11-24

### Patch Changes

- Updated dependencies: druxt-router@0.24.0, druxt-blocks@0.14.1, druxt-breadcrumb@0.13.1, druxt-entity@0.21.2, druxt-views@0.16.1.

## 0.10.0 - 2021-11-10

### Minor Changes

- Replaced File Proxy with Druxt proxy. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))
- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Updated dependencies: druxt-entity@0.21.0, druxt-views@0.16.0, druxt-schema@0.9.0, druxt-blocks@0.14.0, druxt-breadcrumb@0.13.0, druxt@0.13.0, druxt-menu@0.15.0, druxt-router@0.23.0.

## 0.9.1 - 2021-10-10

### Patch Changes

- Enabled Nuxt components auto-discovery by default. ([#310](https://github.com/druxt/druxt.js/issues/310), [`e3e634c`](https://github.com/druxt/druxt.js/commit/e3e634cf))
- Updated dependencies: druxt@0.12.0, druxt-router@0.22.0, druxt-menu@0.14.1, druxt-entity@0.20.0, druxt-views@0.15.0, druxt-blocks@0.13.1, druxt-breadcrumb@0.12.1, druxt-schema@0.8.1.

## 0.9.0 - 2021-09-29

### Minor Changes

- Defaulted the router pages option on the presence of a pages/ directory. ([#292](https://github.com/druxt/druxt.js/issues/292), [`9d905e8`](https://github.com/druxt/druxt.js/commit/9d905e86))
- Updated storybook integration. ([`8d28c18`](https://github.com/druxt/druxt.js/commit/8d28c18))
- Added default theme option and fallback to DruxtSite component. ([`97d24d5`](https://github.com/druxt/druxt.js/commit/97d24d5))
- Added default layout. ([`97d24d5`](https://github.com/druxt/druxt.js/commit/97d24d5))

### Patch Changes

- Fixed default @nuxtjs/proxy settings. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Updated dependencies: druxt-router@0.21.0, druxt-views@0.14.0, druxt-breadcrumb@0.12.0, druxt-blocks@0.13.0, druxt-entity@0.19.0, druxt-menu@0.14.0, druxt-schema@0.8.0, druxt@0.11.0.

## 0.8.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))

### Patch Changes

- Updated dependencies: druxt-router@0.20.0, druxt-blocks@0.12.0, druxt-breadcrumb@0.11.0, druxt@0.10.0, druxt-entity@0.18.0, druxt-menu@0.13.0, druxt-views@0.13.0, druxt-schema@0.7.10.

## 0.7.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))
- Updated dependencies: druxt-blocks@0.11.1, druxt-breadcrumb@0.10.1, druxt-entity@0.17.1, druxt-menu@0.12.1, druxt-router@0.19.1, druxt-schema@0.7.9, druxt-views@0.12.1.

## 0.7.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtSite } from 'druxt-site'
  +import DruxtSite from 'druxt-site/dist/components/DruxtSite.vue'
  ```

- Added BlockRegion \$refs to DruxtSite component. ([`da19102`](https://github.com/druxt/druxt.js/commit/da19102))

### Patch Changes

- Added fallback to Nuxt component if no Blocks are set. ([`a6a6592`](https://github.com/druxt/druxt.js/commit/a6a6592))
- Updated dependencies: druxt-blocks@0.11.0, druxt-breadcrumb@0.10.0, druxt@0.9.0, druxt-entity@0.17.0, druxt-menu@0.12.0, druxt-router@0.19.0, druxt-views@0.12.0, druxt-schema@0.7.8.

## 0.6.0 - 2021-07-07

### Minor Changes

## 0.5.2 - 2021-06-02

### Patch Changes

## 0.5.1 - 2021-06-02

### Patch Changes

## 0.5.0 - 2021-06-02

### Minor Changes

## 0.4.0 - 2021-02-27

### Minor Changes

## 0.3.0 - 2020-12-18

### Minor Changes

## 0.2.2 - 2020-10-25

### Patch Changes

## 0.2.1 - 2020-10-24

### Patch Changes

## 0.2.0 - 2020-10-16

### Minor Changes

## 0.1.1 - 2020-10-09

### Patch Changes

## 0.1.0 - 2020-10-01

### Minor Changes
