# druxt-router

## 0.32.0 - 2026-10-10

### Minor Changes

- Clear every Druxt cache with `this.$store.dispatch('druxt/clearCache')`, or clear the client's caches with `this.$druxt.clearCache()`. The new `druxtRouter/flushRoutes` mutation removes one stored route, or all of them. ([`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))
  Drupal can empty the server cache when content changes. Set a secret:

  ```js
  // nuxt.config.js
  export default {
    druxt: {
      cache: { secret: process.env.DRUXT_CACHE_SECRET },
    },
  };
  ```

  Then send `POST /_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The secret stays on the server. Each Nuxt process has a separate cache, so a site with several processes needs each one cleared. The package README shows how to send it from Drupal with the Purge module.

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- A request that was already in flight when the cache was cleared no longer stores what it fetched before the clear. Clearing the cache because content changed in Drupal could leave the old content served for the rest of its lifetime. ([`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))
  The same holds for the client's JSON:API index and the store: an index or store request in flight during a clear is not kept, and a call made after the clear fetches afresh instead of joining it. The router, Views and menu stores drop a route, result or menu fetched before a flush in the same way.

  A route dropped that way is still the route being rendered, so it is now the active route even though the cache does not hold it. The page title, breadcrumb and block regions follow the page in front of the visitor instead of the one before it. `druxtRouter/setRoute` takes `{ path, route }` as well as a path, and a route the cache never stored, such as one behind a `500`, is now the active route where it used to leave the previous route in place.

- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Route errors such as 403 and 404 are now returned by the `druxtRouter/get` action and rendered by the Router middleware via the Nuxt `error()` function. The Nuxt plugin also reuses the `app.$druxt` client when available instead of creating a second DruxtClient. ([`4be5c92`](https://github.com/druxt/druxt.js/commit/4be5c921a5b9cc01e1fd9a9e6d73751b5b38e79a))
- Prevented the home path "/" redirecting to "/<langcode>". ([`27e7c50`](https://github.com/druxt/druxt.js/commit/27e7c50321f52fba55997589c39b71411b28e839))
- A route lookup that fails without a 4xx from Drupal, such as a network error, is no longer stored, so the next visit to that path asks again. ([`e485374`](https://github.com/druxt/druxt.js/commit/e485374a23630c314fc03a0abb0f04edb1c5f2fe))
- Updated dependencies: druxt@0.25.0.

## 0.31.0 - 2023-11-02

### Patch Changes

- Updated dependencies: druxt@0.24.0.

## 0.30.0 - 2023-07-25

### Minor Changes

- Added @nuxtjs/axios support to the Router plugin, so requests to the Decoupled Router carry the app Axios configuration, including authentication headers. ([#660](https://github.com/druxt/druxt.js/issues/660), [`8609410`](https://github.com/druxt/druxt.js/commit/86094105))

### Patch Changes

- Updated dependencies: druxt@0.23.0.

## 0.29.1 - 2023-07-05

### Patch Changes

- Updated dependencies: druxt@0.22.0.

## 0.29.0 - 2022-11-03

### Minor Changes

- Updated component to support the DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))

### Patch Changes

- Updated dependencies: druxt@0.21.0.

## 0.28.0 - 2022-08-12

### Minor Changes

- Enabled dependencies when only using Nuxt druxt-router module. ([`54c8ece`](https://github.com/druxt/druxt.js/commit/54c8ece3))

### Patch Changes

- Added DruxtModule props to component module stories. ([`fc811db`](https://github.com/druxt/druxt.js/commit/fc811db3))
- Updated dependencies: druxt@0.20.0.

## 0.27.4 - 2022-07-08

### Patch Changes

- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))
- Updated dependencies: druxt@0.19.3.

## 0.27.3 - 2022-05-30

### Patch Changes

- Fixed issue with single-lingual sites using JSON:API Extras. ([`9819eee`](https://github.com/druxt/druxt.js/commit/9819eeed))
- Updated dependencies: druxt@0.19.2.

## 0.27.2 - 2022-05-27

### Patch Changes

- Fixed issues on single-lingual sites. ([`f86b372`](https://github.com/druxt/druxt.js/commit/f86b372f))

## 0.27.1 - 2022-05-24

### Patch Changes

- Fixed issues on single-lingual sites. ([`4150e25`](https://github.com/druxt/druxt.js/commit/4150e25))
- Updated dependencies: druxt@0.19.1.

## 0.27.0 - 2022-05-23

### Minor Changes

- Added langcode support to the DruxtRouter. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added langcode to component mixins. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

### Patch Changes

- Updated dependencies: druxt@0.19.0.

## 0.26.1 - 2022-02-23

### Patch Changes

- Added support for the @nuxtjs/axios module. ([#63](https://github.com/druxt/druxt.js/issues/63), [`e3d5238`](https://github.com/druxt/druxt.js/commit/e3d5238c))
- Updated dependencies: druxt@0.18.0.

## 0.26.0 - 2022-02-07

### Minor Changes

- Added debug and default slots to the DruxtRouter component. ([`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Improved DruxtRouter storybook stories and documentation. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Updated dependencies: druxt@0.17.0.

## 0.25.0 - 2021-12-30

### Minor Changes

- Added improved error handling. ([`7b749bd`](https://github.com/druxt/druxt.js/commit/7b749bd))

### Patch Changes

- Updated dependencies: druxt@0.16.0.

## 0.24.2 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0.

## 0.24.1 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0.

## 0.24.0 - 2021-11-24

### Minor Changes

- Added Storybook integration for the DruxtRouter component. ([`9161b38`](https://github.com/druxt/druxt.js/commit/9161b38))
- Added ability to render a specific route using the Path property. ([`9161b38`](https://github.com/druxt/druxt.js/commit/9161b38))

  ```jsx
  <DruxtRouter path="/node/1" />
  ```

- Added fetch hook to DruxtRouter component. ([`9161b38`](https://github.com/druxt/druxt.js/commit/9161b38))
- Added option to disable the DruxtRouter page middleware. ([`9161b38`](https://github.com/druxt/druxt.js/commit/9161b38))

  ```js
  export default {
    druxt: {
      router: {
        middleware: false,
      },
    },
  };
  ```

  Note: This is experimental and your results may vary.

## 0.23.0 - 2021-11-10

### Minor Changes

- Added support for API Proxy. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))

### Patch Changes

- Updated dependencies: druxt@0.13.0.

## 0.22.0 - 2021-10-10

### Minor Changes

- Throw Error on router errors. ([`c7b267a`](https://github.com/druxt/druxt.js/commit/c7b267a))

### Patch Changes

- Updated dependencies: druxt@0.12.0.

## 0.21.0 - 2021-09-29

### Minor Changes

- Set router `pages` option default based on presence of `pages/` directory. ([`9d905e8`](https://github.com/druxt/druxt.js/commit/9d905e8))
- Moved Nuxt module to `druxt-router/nuxt`. ([`9d905e8`](https://github.com/druxt/druxt.js/commit/9d905e8))

  ⚠ Potential breaking change

  ```diff
  -modules: ['druxt-router']
  +modules: ['druxt-router/nuxt']
  ```

- Added module-level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))

### Patch Changes

- Updated dependencies: druxt@0.11.0.

## 0.20.0 - 2021-09-19

### Minor Changes

- Enabled Nuxt Vuex store by default. ([`1ab762c`](https://github.com/druxt/druxt.js/commit/1ab762c))
- Added option to disable wildcard route. ([`ecefef5`](https://github.com/druxt/druxt.js/commit/ecefef5))
- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))
- Added option to disable `pages/` routes. ([`cbc66cd`](https://github.com/druxt/druxt.js/commit/cbc66cd))

### Patch Changes

- Updated dependencies: druxt@0.10.0.

## 0.19.1 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))

## 0.19.0 - 2021-09-13

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtRouter } from 'druxt-router'
  +import DruxtRouter from 'druxt-router/dist/components/DruxtRouter.vue'
  ```

### Patch Changes

- Updated dependencies: druxt@0.9.0.

## 0.18.1 - 2021-04-28

### Patch Changes

- Added `hid` to canonical meta tag.
- Fixed issue with metatags.

## 0.18.0 - 2021-02-09

### Minor Changes

- Deprecated client methods in favour of DruxtClient.

## 0.17.3 - 2021-02-02

### Patch Changes

- Fixed issue with querystring and getRedirect().

## 0.17.2 - 2021-01-08

### Patch Changes

- Updated dependencies.

## 0.17.1 - 2020-12-17

### Patch Changes

- Fixed issue with permission check.

## 0.17.0 - 2020-12-04

### Minor Changes

- Added support for DruxtComponentMixin.

## 0.16.1 - 2020-11-14

### Patch Changes

- Updated Nuxt module.
- Updated dependencies.

## 0.16.0 - 2020-08-27

### Minor Changes

- Added documentation.
- Updated dependencies.

## 0.15.0 - 2020-07-12

### Minor Changes

- Added resolved path to router information.
- Added `all` option to getResources.

## 0.14.0 - 2020-07-07

### Minor Changes

- Added support for Drupal JSON:API Params.
- Added addHeaders() method.

## 0.13.0 - 2020-06-30

### Minor Changes

- Added resource index.
- Added support for remapped resources.
- Added getResources method.

## 0.12.0 - 2020-06-13

### Minor Changes

- Added support for customisable endpoint.
- Added type and uuid data.
- Fixed hydration issue.

## 0.11.1 - 2020-06-05

### Patch Changes

- Fixed hydration issue.

## 0.11.0 - 2020-06-05

### Minor Changes

- Added support for additional router types.
- Added support for JSON:API Views routes.

## 0.10.1 - 2020-06-01

### Patch Changes

- Fixed router WSOD error.

## 0.10.0 - 2020-05-17

### Minor Changes

- Added configurable Router component.
- Refactored DruxtRouterEntityMixin.
- Removed support for JSON API Deserializer.

## 0.9.0 - 2020-04-28

### Minor Changes

- Updated module to use shared Druxt configuration.

## 0.8.0 - 2020-03-31

### Minor Changes

- Improved error handling for missing routes.

## 0.7.0 - 2020-03-26

### Minor Changes

- Added getRoute action to Vuex store.
- Refactored Nuxt plugin.

## 0.6.0 - 2020-03-19

### Minor Changes

- Added Axios settings support.

## 0.5.0 - 2020-03-18

### Minor Changes

- Added support for redirects.
- Added support for JSON API resourceName.

## 0.4.2 - 2020-03-13

### Patch Changes

- Fixed various issues.

## 0.4.1 - 2020-03-13

### Patch Changes

- Fixed various issues.

## 0.4.0 - 2020-03-13

### Minor Changes

## 0.3.0 - 2020-03-04

### Minor Changes

## 0.2.2 - 2020-03-03

### Patch Changes

## 0.2.1 - 2020-03-02

### Patch Changes

## 0.2.0 - 2020-02-27

### Minor Changes

## 0.1.0 - 2019-12-04

### Initial release
