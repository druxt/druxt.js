# druxt-menu

## 0.21.0 - 2024-01-08

### Minor Changes

- Added the druxtMenu/flushEntities Vuex mutation, so cached menus can be flushed, for example on logout. ([#684](https://github.com/druxt/druxt.js/issues/684), [`26b1bc6`](https://github.com/druxt/druxt.js/commit/26b1bc6f))

## 0.20.0 - 2023-11-08

### Minor Changes

- Fixed menus not updating with authenticated links when logged in on a statically generated site. ([#679](https://github.com/druxt/druxt.js/issues/679), [`6298025`](https://github.com/druxt/druxt.js/commit/62980259))

## 0.19.3 - 2023-11-02

### Patch Changes

- Added Nuxt Auth Axios instance to the DruxtMenu plugin to ensure correct results are provided when authenticated. ([#679](https://github.com/druxt/druxt.js/issues/679))

## 0.19.2 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt@0.24.0.

## 0.19.1 - 2023-07-05

### Patch Changes

- Updated dependencies: druxt@0.22.0, druxt-blocks@0.17.1.

## 0.19.0 - 2022-11-03

### Minor Changes

- Updated components to support the DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt@0.21.0, druxt-blocks@0.17.0.

## 0.18.0 - 2022-08-12

### Minor Changes

- Changed the default menu data source to the JSON:API Menu Items module, which covers the system and plugin menus that core JSON:API menu items cannot provide; set `menu.jsonApiMenuItems: false` for the old behaviour. ([#539](https://github.com/druxt/druxt.js/issues/539), [`3330187`](https://github.com/druxt/druxt.js/commit/33301873))
- Enabled dependencies when only using Nuxt druxt-menu module. ([`54c8ece`](https://github.com/druxt/druxt.js/commit/54c8ece3))

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt-blocks@0.16.3, druxt@0.20.0.

## 0.17.1 - 2022-07-08

### Patch Changes

- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3, druxt-blocks@0.16.2.

## 0.17.0 - 2022-05-23

### Minor Changes

- Added multilingual support to the DruxtMenu component. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  example:

  ```jsx
  <DruxtMenu name="main" langcode="es" />
  ```

- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added multilingual support to Block components. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0, druxt-blocks@0.16.0.

## 0.16.3 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))
- Updated dependencies: druxt-blocks@0.15.2, druxt@0.18.2.

## 0.16.2 - 2022-03-17

### Patch Changes

- Fixed external menu links. ([`35f439e`](https://github.com/druxt/druxt.js/commit/35f439e))
- Updated dependencies: druxt@0.18.1.

## 0.16.1 - 2022-02-23

### Patch Changes

- Updated dependencies: druxt@0.18.0, druxt-blocks@0.15.1.

## 0.16.0 - 2022-02-07

### Minor Changes

- Improved DruxtMenu storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Updated dependencies: druxt-blocks@0.15.0, druxt@0.17.0.

## 0.15.3 - 2021-12-30

### Patch Changes

- Updated dependencies: druxt@0.16.0, druxt-blocks@0.14.4.

## 0.15.2 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0, druxt-blocks@0.14.3.

## 0.15.1 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0, druxt-blocks@0.14.2.

## 0.15.0 - 2021-11-10

### Minor Changes

- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Updated dependencies: druxt-blocks@0.14.0, druxt@0.13.0.

## 0.14.3 - 2021-10-13

### Patch Changes

- Removed debug code. ([`631598d`](https://github.com/druxt/druxt.js/commit/631598d))

## 0.14.1 - 2021-10-10

### Patch Changes

- Fixed bug when menu endpoint fails. ([`ee15810`](https://github.com/druxt/druxt.js/commit/ee15810))
- Updated dependencies: druxt@0.12.0, druxt-blocks@0.13.1.

## 0.14.0 - 2021-09-29

### Minor Changes

- Added module level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
- Updated storybook integration. ([`8d28c18`](https://github.com/druxt/druxt.js/commit/8d28c18))

### Patch Changes

- Updated dependencies: druxt-blocks@0.13.0, druxt@0.11.0.

## 0.13.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))

### Patch Changes

- Fixed path to components in Storybook. ([`49454cb`](https://github.com/druxt/druxt.js/commit/49454cb))
- Updated dependencies: druxt-blocks@0.12.0, druxt@0.10.0.

## 0.12.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))
- Updated dependencies: druxt-blocks@0.11.1.

## 0.12.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtMenu } from 'druxt-menu'
  +import DruxtMenu from 'druxt-menu/dist/components/DruxtMenu.vue'
  ```

### Patch Changes

- Updated dependencies: druxt-blocks@0.11.0, druxt@0.9.0.

## 0.11.0 - 2021-07-07

### Minor Changes

- Added support for default template injection.

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080)

- Added support for v-model.
- Updated dependencies.

## 0.10.3 - 2021-06-12

### Patch Changes

- Added fetchKey to fix hydration issue.

## 0.10.2 - 2021-06-03

### Patch Changes

- Fixed hydration issue.

## 0.10.1 - 2021-05-11

### Patch Changes

- Added parentId prop.
- Fixed issue with missing \$attrs / propsData.

## 0.10.0 - 2021-05-09

### Minor Changes

- Refactored DruxtMenu component for DruxtModule.
- Added ability to filter JSON:API fields.

## 0.9.0 - 2021-03-07

### Minor Changes

- Added Storybook integration.
- Fixed bug with parent template.

## 0.8.0 - 2021-02-27

### Minor Changes

- Added support for DruxtClient and DruxtStore.

## 0.7.0 - 2021-01-14

### Minor Changes

- Added [DruxtMenuMixin](/api/packages/menu/mixins/menu).

## 0.6.2 - 2021-01-07

### Patch Changes

- Updated dependencies.

## 0.6.1 - 2020-11-15

### Patch Changes

- Updated dependencies.

## 0.6.0 - 2020-11-14

### Minor Changes

- Updated DruxtMenu for Druxt component system.
- Added \$attrs passthrough.

## 0.5.0 - 2020-09-17

### Minor Changes

- Improved support for JSON:API Menu Item subtrees.
- Updated dependencies.

## 0.4.0 - 2020-09-07

### Minor Changes

## 0.3.0 - 2020-07-12

### Minor Changes

## 0.2.0 - 2020-06-14

### Minor Changes

## 0.1.1 - 2020-04-28

### Patch Changes

## 0.1.0 - 2020-04-28

### Initial release
