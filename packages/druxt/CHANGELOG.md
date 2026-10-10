# druxt

## 0.25.0 - 2026-10-10

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

- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))
- Wrapper components no longer render the module data they receive as HTML attributes, so an entity renders `<div>` where it rendered `<div entity="[object Object]" fields="[object Object]">`. Wrappers still read that data from `$attrs`. ([`b9bc480`](https://github.com/druxt/druxt.js/commit/b9bc480692dd7bebf8b9c318a1b64d6b78adb491))
  An `id` set on a module no longer repeats on the modules below it.

### Patch Changes

- Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it. ([`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- The Druxt store now shares a request that is already in flight. Components that ask for the same resource or collection concurrently make one backend request between them. A failed request is not kept, so the next call tries again. ([`8e16305`](https://github.com/druxt/druxt.js/commit/8e16305a68bb443759136d28b32c1f8ffaffa102))
- Druxt components now keep their rendered content while they fetch again. Before, a component with a default slot and no wrapper component went blank during a refetch, which made the page jump after it loaded. A failed fetch with no component data of its own no longer throws while the component fetches again. ([`716eab0`](https://github.com/druxt/druxt.js/commit/716eab019a1b86046ad2b421c31e277c8517d1a4))
- A request that was already in flight when the cache was cleared no longer stores what it fetched before the clear. Clearing the cache because content changed in Drupal could leave the old content served for the rest of its lifetime. ([`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))
  The same holds for the client's JSON:API index and the store: an index or store request in flight during a clear is not kept, and a call made after the clear fetches afresh instead of joining it. The router, Views and menu stores drop a route, result or menu fetched before a flush in the same way.

  A route dropped that way is still the route being rendered, so it is now the active route even though the cache does not hold it. The page title, breadcrumb and block regions follow the page in front of the visitor instead of the one before it. `druxtRouter/setRoute` takes `{ path, route }` as well as a path, and a route the cache never stored, such as one behind a `500`, is now the active route where it used to leave the previous route in place.

- A resource of a type the JSON:API index does not list, such as a View, is fetched under the language prefix it was asked for. The client dropped the prefix for such types, so every View rendered in the site's default language. ([`e929d3f`](https://github.com/druxt/druxt.js/commit/e929d3fd115ec52baa5fb4cb4e35319eeae29657))
  A `DruxtClient` constructed with an endpoint that has no leading slash, such as `api`, now adds one, so a prefix joins it as `/es/api` without a missing slash.
- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- `getCollection` now returns fully hydrated resources in `included`. ([#781](https://github.com/druxt/druxt.js/issues/781), [`56929b7`](https://github.com/druxt/druxt.js/commit/56929b77735fec84418231b7c1fb32e36f8ce977))
  on a cache hit, matching what a fresh fetch returns, where it previously
  returned bare `{ id, type }` references. A resource removed with
  `flushResource` is fetched again on the next collection request instead of
  coming back as an undefined entry, and a cached collection returns only the
  includes its most recent response carried.
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Unpin the axios peer to >=0.28.0, because transpiling axios in the Nuxt module is what fixes [#658](https://github.com/druxt/druxt.js/issues/658), not the pin. ([#929](https://github.com/druxt/druxt.js/issues/929), [`b198ac5`](https://github.com/druxt/druxt.js/commit/b198ac52c37e5a539517f652b4059bbfb78dff84))
- The JSON:API index is now shared between DruxtClient instances that use the same Axios instance for the same base URL, endpoint and resource config. Multiple Druxt modules in one process fetch the index once instead of once per client, concurrent requests share the one fetch, and a client with its own Axios instance, and so its own credentials, keeps its own index. ([`43ddd7b`](https://github.com/druxt/druxt.js/commit/43ddd7b7b59be0a76fd98a715857fd64f60be9b4))
- Schemas can follow display changes in Drupal without a rebuild. With `druxt.schema.refresh`, the Nuxt server regenerates a schema the first time a page needs it and holds it until the next cache clear. The browser fetches it from the server at `/_druxt/schema/<id>`, and the schema from the build is used whenever regeneration fails. Under `nuxt dev` each request regenerates, as there is no cache to clear. A static site keeps the schemas from its build, unless its own Node server serves the route with `createSchemaRefresh`. ([`b07a3e3`](https://github.com/druxt/druxt.js/commit/b07a3e3b4e1521a97ba4d5187c260432dadf47ac))
  `druxt/clearCache` now also flushes the stored schemas.
- Where clients share one Axios instance and each sets its own `sessionCookie`, only the first pattern was checked for credentials added while a request was sent. A session cookie matching any later pattern did not mark the instance as credentialed, so an authenticated response could be kept in the shared cache and served to an anonymous request. Every pattern registered on an instance is now checked. ([`d3ea0ae`](https://github.com/druxt/druxt.js/commit/d3ea0ae0da1db6fe62e52cce92e32250a57bae49))
- Pin axios to 0.28.0 and transpile axios in the Nuxt module so a hoisted ESM axios cannot break the dev server. ([#658](https://github.com/druxt/druxt.js/issues/658), [`11c5516`](https://github.com/druxt/druxt.js/commit/11c5516875ccadfd00cd61cc644b474b1607d056))
- A module now rebuilds its wrapper's propsData when its own props change. Before, `propsData` was built once inside `fetch()`, and Nuxt 2 does not re-run `fetch()` for a prop change, so a component instance Vue reused across one kept whatever it was first given. A `DruxtField` re-rendered with a form schema went on rendering the read-only view output, with no label, textarea or editor. ([`17811be`](https://github.com/druxt/druxt.js/commit/17811bec3bed6e47ee44d8616d5ef9503ed5df34))
  The rebuild reuses the props already in hand rather than fetching again, so no extra request is made. An errored module keeps its debug output, and a rebuild that would change nothing is skipped. Where JSON cannot hold a value exactly, such as a callback or a Set, identity decides rather than the JSON text, so two different values are never read as one.
- `druxt/flushCollection` and `druxt/flushResource` now remove what they name, accept a type with a prefix, take the collection's `query` in place of its `hash`, and do nothing for data that was never stored. Before, some combinations did nothing, an unknown type threw, and a flushed resource read with `include` threw. ([`e485374`](https://github.com/druxt/druxt.js/commit/e485374a23630c314fc03a0abb0f04edb1c5f2fe))
  `druxt/getResource` with `bypassCache` now fetches every requested field and returns only the included resources in the fresh response.

  A flush also drops the store's requests in flight. Code that dispatched before the flush still gets its document, but nothing from it is stored. A dispatch made after the flush fetches afresh.

## 0.24.0 - 2023-11-02

- No package changes; version alignment release.

## 0.23.0 - 2023-07-25

### Minor Changes

- Added attrs passthrough to the DruxtWrapper component, so attributes like `role` set via the wrapper reach the rendered markup. ([#87](https://github.com/druxt/druxt.js/issues/87), [`7664d90`](https://github.com/druxt/druxt.js/commit/7664d90d))

## 0.22.0 - 2023-07-05

### Minor Changes

- Added druxt/flushCollection and druxt/flushResource mutations for flushing cached JSON:API data, for example on logout. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))
- Added bypassCache option to druxt/getCollection and druxt/getResource actions. ([#639](https://github.com/druxt/druxt.js/issues/639), [`41cab3a`](https://github.com/druxt/druxt.js/commit/41cab3a0))

## 0.21.1 - 2023-05-15

### Patch Changes

- Fixed included resources being fetched without the language prefix on multilingual sites, which returned default-language content when revisiting a page by client-side navigation. ([#628](https://github.com/druxt/druxt.js/issues/628), [`e46a329`](https://github.com/druxt/druxt.js/commit/e46a3290)) Thanks [@nx-alejandrolacasa](https://github.com/nx-alejandrolacasa).

## 0.21.0 - 2022-11-03

### Minor Changes

- Added DruxtDevelTemplate component to simplify template creation in development mode. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))
- Updated missing default slot message with DruxtDevelTemplate tool. ([#578](https://github.com/druxt/druxt.js/issues/578), [`f6b4a66`](https://github.com/druxt/druxt.js/commit/f6b4a664))
- Added Vue devtools plugin. ([#583](https://github.com/druxt/druxt.js/issues/583), [`29905ff`](https://github.com/druxt/druxt.js/commit/29905ff6))

## 0.20.0 - 2022-08-12

### Minor Changes

- Removed the hard permission-check error from API requests, so content a role cannot access (for example permission-restricted blocks) no longer breaks the page render. ([#543](https://github.com/druxt/druxt.js/issues/543), [`49b6787`](https://github.com/druxt/druxt.js/commit/49b67872))

## 0.19.3 - 2022-07-08

### Patch Changes

- Normalized slashes for baseUrl and endpoint options. ([`44f97b9`](https://github.com/druxt/druxt.js/commit/44f97b9c))
- Fixed plugin paths issue for Windows users. ([`352b7a5`](https://github.com/druxt/druxt.js/commit/352b7a51))
- Fixed support for nuxt/storybook. ([`45e14b8`](https://github.com/druxt/druxt.js/commit/45e14b84))

## 0.19.2 - 2022-05-30

### Patch Changes

- Fixed issue with single-lingual sites using JSON:API Extras. ([`9819eee`](https://github.com/druxt/druxt.js/commit/9819eeed))
- Changed order of Druxt Proxy entries. ([`4ff0ad8`](https://github.com/druxt/druxt.js/commit/4ff0ad81))

## 0.19.1 - 2022-05-24

### Patch Changes

- Fixed issues on single-lingual sites. ([`4150e25`](https://github.com/druxt/druxt.js/commit/4150e25))

## 0.19.0 - 2022-05-23

### Minor Changes

- Added langcode / prefix support to DruxtClient methods. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  ```js
  const data = await druxt.getResource('node--article', id, undefined, 'en');
  ```

- Added langcode-suffixed component options for multilingual templates. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  example:

  ```diff
  + DruxtEntityNodeArticleFullEn
  + DruxtEntityNodeArticleFullEs
  ```

- Added langcode prefix support to the DruxtStore. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

  ⚠ Potential breaking change

  ```diff
  - $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12
  + $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12[undefined]
  + $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12.en
  + $store.state.druxt.collections['view--view'].abefce528d89d7fcf5c59d4469f33e12.es
  - $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec']
  + $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec'][undefined]
  + $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec'].en
  + $store.state.druxt.resources['node--recipe']['67f44980-de26-4567-82f4-b058595720ec'].es
  ```

- Added language prefixes to API proxy support. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))
- Added multilingual support to the base DruxtModule component. ([`be21952`](https://github.com/druxt/druxt.js/commit/be21952))

## 0.18.3 - 2022-05-06

### Patch Changes

- Fixed proxy when using deprecated Axios options. ([`e6cf1fc`](https://github.com/druxt/druxt.js/commit/e6cf1fc))

## 0.18.2 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))

## 0.18.1 - 2022-03-17

### Patch Changes

- Fixed Axios proxy being incorrectly enabled. ([`80164a1`](https://github.com/druxt/druxt.js/commit/80164a1))

## 0.18.0 - 2022-02-23

### Minor Changes

- Added support for the @nuxtjs/axios module. ([`e3d5238`](https://github.com/druxt/druxt.js/commit/e3d5238))

## 0.17.0 - 2022-02-07

### Minor Changes

- Added README story to storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added required props error to DruxtModule components. ([`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added DruxtModule story to storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))
- Added DruxtDebug story to storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`b79701c`](https://github.com/druxt/druxt.js/commit/b79701c))

### Patch Changes

- Fixed errors in storybook. ([#249](https://github.com/druxt/druxt.js/issues/249), [`d7e92b2`](https://github.com/druxt/druxt.js/commit/d7e92b2))

## 0.16.0 - 2021-12-30

### Minor Changes

- Made the \$druxt plugin first to be available to all Druxt module plugins. ([`dc226c2`](https://github.com/druxt/druxt.js/commit/dc226c2))
- Added improved error handling, with more context in error messages. ([#408](https://github.com/druxt/druxt.js/issues/408), [`7b749bd`](https://github.com/druxt/druxt.js/commit/7b749bd5), [`bc079cf`](https://github.com/druxt/druxt.js/commit/bc079cfb))

## 0.15.0 - 2021-12-11

### Minor Changes

- Reduced Fetch based UI flicker in the DruxtModule. ([`2ae1d6d`](https://github.com/druxt/druxt.js/commit/2ae1d6d))

## 0.14.0 - 2021-12-04

### Minor Changes

- Added debug mode and Axios request logging. ([`85fff42`](https://github.com/druxt/druxt.js/commit/85fff42))

  ```
  export default {
    druxt: {
      // Enable debug log messages.
      debug: true,
    }
  }
  ```

- Added ability to render readable JSON with the DruxtDebug component. ([`39e2e2e`](https://github.com/druxt/druxt.js/commit/39e2e2e))

  ```jsx
  <DruxtDebug :json="{ data: [{ one: true, two: false }] }" />
  ```

- Made summary prop optional on DruxtDebug component. ([`9c33d82`](https://github.com/druxt/druxt.js/commit/9c33d82))
- Added Druxt version to Nuxt badge. ([`45bc0b9`](https://github.com/druxt/druxt.js/commit/45bc0b9))

## 0.13.0 - 2021-11-10

### Minor Changes

- Added ability to proxy the API. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))

  ```js
  export default {
    druxt: {
      proxy: {
        api: true,
      },
    },
  };
  ```

  Creates two proxy entries:

  - The JSON:API: `${ENDPOINT}` -> `${BASEURL}${ENDPOINT}`
  - The Decoupled Router:`/router/translate-path` -> `${BASEURL}/router/translate-path`

- Added ability to proxy the Drupal file system. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))

  ```js
  export default {
    druxt: {
      proxy: {
        files: 'default',
      },
    },
  };
  ```

  Creates a proxy entry:

  - `/sites/${PATH}/files` -> `${BASEURL}/site/${PATH}/files`

- Changed template-injected module components to not use a DruxtWrapper component by default. ([`c4457e1`](https://github.com/druxt/druxt.js/commit/c4457e1))
- Refactored DruxtModule fetch hooks. ([`e7b1533`](https://github.com/druxt/druxt.js/commit/e7b1533))

## 0.12.0 - 2021-10-10

### Minor Changes

- Added createResource method to DruxtClient. ([`897dcbc`](https://github.com/druxt/druxt.js/commit/897dcbc))

  ```js
  this.$druxt.createResource({ type, attributes: {}, relationships: {} });
  ```

- Added updateResource method to DruxtClient. ([`897dcbc`](https://github.com/druxt/druxt.js/commit/897dcbc))

  ```js
  await this.$druxt.updateResource({
    type,
    id,
    attributes: {},
    relationships: {},
  });
  ```

- Added getRelated() method. ([`4504a2f`](https://github.com/druxt/druxt.js/commit/4504a2f))

  ```js
  await this.$druxt.getRelated(type, id, related);
  ```

- Enabled Components auto-discovery by default. ([`e3e634c`](https://github.com/druxt/druxt.js/commit/e3e634c))

## 0.11.0 - 2021-09-29

### Minor Changes

- Added Druxt modules settings to `$druxt.settings`. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))

### Patch Changes

- Fixed issue with Axios settings and Storybook. ([`75ff8a9`](https://github.com/druxt/druxt.js/commit/75ff8a9))

## 0.10.0 - 2021-09-19

### Minor Changes

- Updated component registration method to use the Nuxt `components:dirs` hook. ([`715e5ef`](https://github.com/druxt/druxt.js/commit/715e5ef))
- Added DruxtDebug component. ([`2b8c3f3`](https://github.com/druxt/druxt.js/commit/2b8c3f3))
- Added Druxt API URL to Nuxt CLI badge. ([`317184e`](https://github.com/druxt/druxt.js/commit/317184e))

## 0.9.0 - 2021-09-13

### Patch Changes

- Updated the scule dependency to ^0.2.0. ([`d27081b`](https://github.com/druxt/druxt.js/commit/d27081b2))

### Minor Changes

- Moved Vue components out of bundle. ([`21170fb`](https://github.com/druxt/druxt.js/commit/21170fb))

  ⚠ Potential breaking change

  _**Note:** This only effects custom Druxt modules and implementations._

  ```diff
  -import { DruxtModule } from 'druxt'
  +import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
  ```

## 0.8.3 - 2021-07-06

### Patch Changes

- Fixed issue with attrs passthrough.

## 0.8.2 - 2021-07-06

### Patch Changes

- Fixed bug with fetchKey and attrs passthrough.

## 0.8.1 - 2021-06-22

### Patch Changes

- Fixed DruxtModule emit behavior.

## 0.8.0 - 2021-06-20

### Minor Changes

- Added support for default template injection to DruxtModule.

  _**Example:** Default template injection with DruxtEntity and DruxtMenu components_

  ```vue
  <DruxtEntity v-bind="props">
    <template #default="{ entity }">
      <h2>{{ entity.attributes.title }}</h2>
      <DruxtMenu name="main" :depth="1" :parentId="parentId(entity)">
        <template #default="{ items }">
          {{ items }}
        </template>
      </DruxtMenu>
    </template>
  </DruxtEntity>
  ```

## 0.7.1 - 2021-06-15

### Patch Changes

- Fixed issue with attrs passthrough.
- Updated support for Drupal JSON-API Params.

Thanks to [d34dman](https://github.com/d34dman)

## 0.7.0 - 2021-06-10

### Minor Changes

- Added support for v-model to DruxtModule.

  _**Example:** Passing a custom entity model to the DruxtEntity component_

  ```vue
  <DruxtEntity
    type="node--article"
    v-model="{
      attributes: {
        title: 'My Entity',
        field_name: 'Value',
      },
      relationships: {},
    }"
  />
  ```

## 0.6.1 - 2021-06-10

### Patch Changes

- Fixed issue with normalization of include/sort data.
- Fixed issue with queryobject in getResource action.
- Updated dependencies.

## 0.6.0 - 2021-05-19

### Minor Changes

- Refactored DruxtStore.
  - Added support for partial resources
  - Added dehydration/rehydration of included resources and collections
- Fixed issue with DruxtStore reactivity.

## 0.5.1 - 2021-03-16

### Patch Changes

- Fixed issue with getWrapperData.
- Fixed issue with DruxtStore reactivity.

## 0.5.0 - 2021-03-14

### Minor Changes

- Added DruxtModule component.

  ```vue
  <script>
  import { DruxtModule } from 'druxt';
  export default {
    name: 'MyCustomDruxtModule',
    extends: DruxtModule,
  };
  </script>
  ```

  - For more details, refer to the [DruxtModule API documentation](/api/packages/druxt/components/DruxtModule)

- Added \$attrs/props splitting.

## 0.4.2 - 2021-03-02

### Patch Changes

- Added metadata to Nuxt module.

## 0.4.1 - 2021-02-09

### Patch Changes

- Fixed dependency issues.

## 0.4.0 - 2021-02-01

### Minor Changes

- Added DruxtClient.

  _**Example:** Using the DruxtClient to load a JSON:API resource in a node.js application_

  ```js
  import { DruxtClient } from 'druxt'
  const druxt = new DruxtClient('https://demo-api.druxtjs.org')
  druxt.getResource('node--page', uuid, query).then((resource) => {
    console.log('getResource', resource)
  }))
  ```

  - For more details, refer to the [DruxtClient API documentation](/api/packages/druxt/client)

- Added DruxtStore.

  _**Example:** Using the DruxtStore to load a JSON:API resource within Nuxt_

  ```vue
  <script>
  export default {
    data: () => ({
      resource: null,
    }),

    async fetch() {
      const resource = await this.$store.dispatch('druxt/getResource', {
        type: 'node--article',
        id: uuid,
        query,
      });
      this.resource = resource;
    },
  };
  </script>
  ```

  - For more details, refer to the [DruxtStore API documentation](/api/packages/druxt/stores/druxt)

- Added \$druxt plugin wrapper for DruxtClient.

## 0.3.4 - 2021-01-08

### Patch Changes

- Updated dependencies.

## 0.3.3 - 2020-10-19

### Patch Changes

- Added Inner prop to DruxtComponentMixin.

## 0.3.2 - 2020-10-13

### Patch Changes

- Added sorting of component options.
- Fixed issue with component options.

## 0.3.1 - 2020-10-11

### Patch Changes

- Added DruxtWrapper to DruxtComponentMixin.
- Added unique filter to component options.

## 0.3.0 - 2020-10-10

### Minor Changes

- Moved Site functionality to the [DruxtSite module](/modules/site).
- Added Druxt component and mixin.
- Added available component options data.
- Removed unused Class and Store.

## 0.2.1 - 2020-10-01

### Patch Changes

- Added @nuxtjs/proxy and default configuration.
- Updated dependencies.

## 0.2.0 - 2020-09-08

### Minor Changes

- Updated dependencies.

## 0.1.2 - 2020-08-22

### Patch Changes

- Fixed Vuex store installation.
- Updated dependencies.

## 0.1.1 - 2020-07-20

### Patch Changes

- Removed schema generation workaround.

## 0.1.0 - 2020-07-18

### Initial release
