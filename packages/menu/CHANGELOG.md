# druxt-menu

## 0.22.0 - 2026-10-10

### Minor Changes

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- A request that was already in flight when the cache was cleared no longer stores what it fetched before the clear. Clearing the cache because content changed in Drupal could leave the old content served for the rest of its lifetime. ([`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))
  The same holds for the client's JSON:API index and the store: an index or store request in flight during a clear is not kept, and a call made after the clear fetches afresh instead of joining it. The router, Views and menu stores drop a route, result or menu fetched before a flush in the same way.

  A route dropped that way is still the route being rendered, so it is now the active route even though the cache does not hold it. The page title, breadcrumb and block regions follow the page in front of the visitor instead of the one before it. `druxtRouter/setRoute` takes `{ path, route }` as well as a path, and a route the cache never stored, such as one behind a `500`, is now the active route where it used to leave the previous route in place.

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

- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- In the browser, a menu request is now shared only while it is in flight, so a menu fetched before a login is fetched again after it instead of showing the signed-out menu. ([`e485374`](https://github.com/druxt/druxt.js/commit/e485374a23630c314fc03a0abb0f04edb1c5f2fe))
- A menu still renders when its cache is cleared while it loads. The store drops a menu fetched before a flush, so the component rendered an empty menu until the next fetch. The `druxtMenu/get` action now fetches the menu again when the store is flushed during its request, and returns the menu items it stored. ([`599c870`](https://github.com/druxt/druxt.js/commit/599c8707d4f86d8b736c7db8237afdfc57409671))
- A menu renders again after `druxt/clearCache`, where it used to throw. The clear empties every prefix at once, and the getter then read a prefix that was no longer there, so a page with a menu failed to render until its next fetch. ([`d270d3d`](https://github.com/druxt/druxt.js/commit/d270d3d0f84858dd1555adbc88a06cb7f58ff201))
- The druxt-menu plugin keeps `proxy.api` on in the browser, so a menu client built without the shared druxt client sends its requests through the Nuxt proxy, as the router does. ([`c4867af`](https://github.com/druxt/druxt.js/commit/c4867af5f6cbf67e969b3b6270ffef6e4105e6f2))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- In production, the server now keeps the JSON:API index and menus between requests for as long as Drupal's `Cache-Control` header allows. Drupal only allows it when the page cache max-age is set (Administration > Configuration > Development > Performance). At the default of 0, nothing is kept. ([`a47115e`](https://github.com/druxt/druxt.js/commit/a47115e1e22283073fe9fe2ecadba7f132a764dc))
  A request never reads or fills the cache when its Axios instance sends an Authorization header, basic auth or Drupal's session cookie, and Druxt never stores a response Drupal marks `no-cache`, as Drupal does for every signed-in response. Credentials added by a request interceptor are seen only once a response comes back, so an instance's first lookup can still read a stored entry. Credentials sent in another header, such as an API key, are not recognized. If a proxy renames the session cookie, set `sessionCookie` to match it:

  ```js
  // nuxt.config.js
  export default {
    druxt: {
      cache: {
        ttl: 60, // optional: keep a response at most this many seconds, 0 keeps nothing
        sessionCookie: 'MY_CUSTOM_SESSION[0-9a-f]+',
      },
    },
  };
  ```

  A response whose `Vary` header names a request header the visitor's browser sends is not kept, since the cache cannot tell such variants apart. A Druxt backend sends `Vary: Cookie` and, from the consumers module, `Vary: X-Consumer-ID`, both of which are fine: neither is set by a browser, and a client that sends `X-Consumer-ID` keeps entries of its own. A proxy or module in front of Drupal may add `Accept-Language`, `Origin` or `User-Agent`, and those responses then stay uncached.

  `Vary: Cookie` is treated as Drupal's own page cache treats it: requests without a session cookie share one response, whatever other cookies they send. Modules that change a response by some other cookie, such as a consent or region cookie, are not covered. Name that cookie in `sessionCookie` so requests with it never read or fill the cache, or turn the cache off.

  Menus are kept between requests only with druxt 0.25.0 or later, which this release of druxt-menu requires.

  Set `druxt.cache: false` to turn it off. It is off under `nuxt dev`.

- Menu results are now cached per client and process, requests for one menu that build the same query share a fetch, and the Nuxt plugin reuses the `app.$druxt` client when available instead of creating a second DruxtClient. ([`43ddd7b`](https://github.com/druxt/druxt.js/commit/43ddd7b7b59be0a76fd98a715857fd64f60be9b4))
- The menu store no longer fetches a menu it already holds. A repeat `druxtMenu/get` with the same menu name, settings and prefix does not reach the backend and returns the stored items, and identical concurrent calls share one request. A different name, settings or prefix still fetches, and `druxtMenu/flushEntities` makes the next call fetch again. ([`7367b77`](https://github.com/druxt/druxt.js/commit/7367b77d2ec3d894b0fc5f63d6f637bfb708cb70))
  A flush also reaches the menus being fetched for its prefix. A request still in flight fetches again before it stores anything, and calls made in the meantime wait for that fresh menu. Naming a prefix restricts this to that prefix, leaving requests for the others alone.

  Menus that ask for different fields share their stored items, and each item keeps the fields every menu fetched, so an answer from the store has the fields its menu asked for.

  In the browser, a login or logout clears the stored menus, so the next menu shows the links for the new user.

- Updated dependencies: druxt-blocks@0.18.0, druxt@0.25.0.

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

- Added API Proxy support. ([#362](https://github.com/druxt/druxt.js/issues/362), [`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204c))
- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

### Patch Changes

- Updated dependencies: druxt-blocks@0.14.0, druxt@0.13.0.

## 0.14.3 - 2021-10-13

- Republish of 0.14.2; no package changes.

## 0.14.2 - 2021-10-13

### Patch Changes

- Removed debug code. ([`631598d`](https://github.com/druxt/druxt.js/commit/631598d))

## 0.14.1 - 2021-10-10

### Patch Changes

- Fixed bug when menu endpoint fails. ([`ee15810`](https://github.com/druxt/druxt.js/commit/ee15810))
- Updated dependencies: druxt@0.12.0, druxt-blocks@0.13.1.

## 0.14.0 - 2021-09-29

### Minor Changes

- Added module-level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))
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

  - For details, see the [Druxt 0.8.0 release notes](/api/packages/druxt/CHANGELOG#080---2021-06-20)

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
