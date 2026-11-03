# druxt

## 0.25.1 - 2026-11-01

### Patch Changes

- A query object with nested values, such as a `filter`, reaches Drupal as `filter[status]=1`. It was sent as `filter=`, and Drupal answered 400. ([#962](https://github.com/druxt/druxt.js/issues/962), [`5f69058`](https://github.com/druxt/druxt.js/commit/5f6905886b7de19e2504fe1ff42b1f437a1b2950))

  `getCollection()`, `getCollectionAll()`, `getResource()` and `getRelated()` all send it this way. A nested `null` or `undefined` value is left out, and top-level values are sent as before.

  ```js
  await this.$druxt.getCollection('node--page', {
    filter: { status: 1 },
    page: { limit: 5 },
  });
  // /jsonapi/node/page?filter[status]=1&page[limit]=5
  ```

- `new DruxtClient(baseUrl)` sends requests through the Axios `baseURL` or the proxy, as passing `{ baseUrl }` in the options already did. Before, requests went straight to the Drupal host, because the links read from the JSON:API index still included it. ([#966](https://github.com/druxt/druxt.js/issues/966), [`3fb3b0d`](https://github.com/druxt/druxt.js/commit/3fb3b0d2fa12aeca41e341cf2cfacd3ceb43d28f))

  `DruxtRouter`, `DruxtSchema` and `DruxtMenu` created with a base URL alone change the same way. The Nuxt module passes the base URL both ways, so sites that only use the module are unaffected. A custom `axios` instance in the options now needs its own `baseURL`, and code that passed the base URL both ways can drop the option.

- The Nuxt module loads `@nuxtjs/proxy` only when the `api` or `files` proxy is on. ([#964](https://github.com/druxt/druxt.js/issues/964), [`80f633e`](https://github.com/druxt/druxt.js/commit/80f633e2f160122fa04fa7c1e87b447fc1ccbff3))

  With both off, as with `proxy: { api: false }`, it loaded `@nuxtjs/proxy` with nothing to proxy, so the package had to be installed. A site that relied on that for its own `proxy` entries now adds `@nuxtjs/proxy` to its `modules`.

- A wrapper component that emits `input` from a watcher on its `entity` prop no longer freezes the browser tab. This worked on 0.24 and broke in 0.25.0. ([#973](https://github.com/druxt/druxt.js/issues/973), [`6976985`](https://github.com/druxt/druxt.js/commit/69769857c450c989404aeec15ff6818430975be7))

  Since 0.25.0, a Druxt module such as `DruxtEntity` rebuilds its wrapper's props when they change, and the value the wrapper emits comes back to it as `entity`. For a resource fetched without `include`, each round trip counted as a change, so the wrapper and the module updated each other until the tab ran out of memory. A value that matches what the wrapper already has no longer counts as a change.

- The server cache keeps Drupal's responses on a site whose CORS sends `Vary: Origin`. Before, it kept none of them, not even the JSON:API index. ([#961](https://github.com/druxt/druxt.js/issues/961), [`d3d0458`](https://github.com/druxt/druxt.js/commit/d3d0458aeb2e7e67e7b01f6cb3ccb1388088a144))

  Drupal's CORS adds `Vary: Origin` to every response when it allows more than one origin. The Nuxt server sends no `Origin` header, so its requests all get the same answer and can share one cached copy. A request that sets its own `Origin` header, such as with `addHeaders()`, or that sends credentials, still skips the cache. `druxt.cache: false` turns the cache off.

## 0.25.0 - 2026-10-23

### Minor Changes

- Clear every Druxt cache with `druxt/clearCache`, or let Drupal clear it when content changes: set `druxt.cache.secret` and send `POST /_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The clear empties the JSON:API index and the server cache, and flushes stored resources, view results, menus, routes and schemas ([#903](https://github.com/druxt/druxt.js/issues/903)). A request in flight when it happens stores nothing it fetched. The [druxt README](https://github.com/druxt/druxt.js/tree/HEAD/packages/druxt#clearing-from-drupal-with-purge) shows the Drupal Purge setup. ([#885](https://github.com/druxt/druxt.js/issues/885), [`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))

  ```js
  // nuxt.config.js
  export default {
    druxt: {
      cache: { secret: process.env.DRUXT_CACHE_SECRET },
    },
  };
  ```

  ```sh
  curl -X POST -H "X-Druxt-Secret: $DRUXT_CACHE_SECRET" https://example.com/_druxt/cache/clear
  ```

- In production, the server keeps Drupal's responses between requests for as long as Drupal's `Cache-Control` allows, so set a page cache max-age in Drupal to use it. It keeps the JSON:API index and menus, and with `cache.content: true` ([#639](https://github.com/druxt/druxt.js/issues/639)) it keeps entities, collections, views and route lookups too, so a page's second anonymous visitor costs Drupal nothing. Pair `cache.content` with a clear from Drupal so edits show straight away. Signed-in responses are never kept. Each cache area holds at most `cache.maxSize` of stored JSON, 50 MB by default, and drops the least recently used first. Set `druxt.cache: false` to turn it off. The [druxt README](https://github.com/druxt/druxt.js/tree/HEAD/packages/druxt#server-cache) covers `ttl`, `sessionCookie`, `maxSize` and which responses are kept. ([#848](https://github.com/druxt/druxt.js/issues/848), [`a47115e`](https://github.com/druxt/druxt.js/commit/a47115e1e22283073fe9fe2ecadba7f132a764dc))
  ```js
  // nuxt.config.js
  export default {
    druxt: {
      cache: { content: true, ttl: 300 }, // or `cache: false`
    },
  };
  ```
- `vue` and `vuex` are now peer dependencies, so the packages use the site's own copy. A second copy stopped Nuxt at startup with a version mismatch. ([#875](https://github.com/druxt/druxt.js/issues/875), [`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))
- **Breaking:** Wrapper components no longer render module data as HTML attributes, such as `entity="[object Object]"`. Wrappers still read it from `$attrs`. An `id` set on a module no longer repeats on the modules below it. ([#872](https://github.com/druxt/druxt.js/issues/872), [`b9bc480`](https://github.com/druxt/druxt.js/commit/b9bc480692dd7bebf8b9c318a1b64d6b78adb491))
  ```diff
  - <article entity="[object Object]" schema="[object Object]" id="node-1">
  + <article id="node-1">
  ```

### Patch Changes

- The cache clear handler is bundled with the Nuxt module, so `druxt/server-middleware/` exports only `template.mjs`. ([#950](https://github.com/druxt/druxt.js/issues/950), [`2bf5d3c`](https://github.com/druxt/druxt.js/commit/2bf5d3cacb762429b07d5b5080e55d34be22f955))
- Components no longer flicker or fetch their data again on the first load of a production build. Remove any `components:extend` hook added to work around it. ([#854](https://github.com/druxt/druxt.js/issues/854), [`8b47d6f`](https://github.com/druxt/druxt.js/commit/8b47d6f9a446405a5aa9dd619cbd2cdc8b7f05f8))
- Concurrent requests for the same resource or collection share one backend request. A failed request isn't kept, so the next call tries again. ([#857](https://github.com/druxt/druxt.js/issues/857), [`8e16305`](https://github.com/druxt/druxt.js/commit/8e16305a68bb443759136d28b32c1f8ffaffa102))
- Components keep their content while they fetch again, so a page no longer jumps after a refetch. ([#856](https://github.com/druxt/druxt.js/issues/856), [`716eab0`](https://github.com/druxt/druxt.js/commit/716eab019a1b86046ad2b421c31e277c8517d1a4))
- A request in flight when the store is flushed no longer stores what it fetched, so a flush can't leave old content in place. ([#885](https://github.com/druxt/druxt.js/issues/885), [`75b3768`](https://github.com/druxt/druxt.js/commit/75b37680976671879b03eaf2eb046d799456f5ef))
- Views, and other types the JSON:API index doesn't list, are fetched in the requested language, not the default language. A `DruxtClient` endpoint given without a leading slash, such as `api`, now works with a language prefix. ([#894](https://github.com/druxt/druxt.js/issues/894), [`e929d3f`](https://github.com/druxt/druxt.js/commit/e929d3fd115ec52baa5fb4cb4e35319eeae29657))
- `druxt` depends on consola ^2.15.3, where a `*` peer let a fresh install pick consola 3 and break the Nuxt 2 build. Sites that pinned `consola: 2.15.3` can drop the pin. ([#943](https://github.com/druxt/druxt.js/issues/943), [`1f55b29`](https://github.com/druxt/druxt.js/commit/1f55b29959749d1f44db45b964747b82c3a60738))
- Each package exports its `package.json`, so `require('druxt/package.json')` works. ([#835](https://github.com/druxt/druxt.js/issues/835), [`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- `getCollection` returns full resources in `included` on a cache hit, as a fresh fetch does. A resource removed with `flushResource` is fetched again. ([#781](https://github.com/druxt/druxt.js/issues/781), [`56929b7`](https://github.com/druxt/druxt.js/commit/56929b77735fec84418231b7c1fb32e36f8ce977))
- Package READMEs show their banner on npm. ([#863](https://github.com/druxt/druxt.js/issues/863), [`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- `DruxtClient` instances on the same Axios instance, base URL, endpoint and resource config share one JSON:API index fetch. ([#843](https://github.com/druxt/druxt.js/issues/843), [`43ddd7b`](https://github.com/druxt/druxt.js/commit/43ddd7b7b59be0a76fd98a715857fd64f60be9b4))
- Revisiting a page no longer fetches related resources, such as paragraphs, again with an include their type doesn't have, which Drupal refused with a 400 and turned Nuxt's loading bar red. A nested include such as `field_content.field_media` also includes `field_content`, as JSON:API does. ([#953](https://github.com/druxt/druxt.js/issues/953), [`31f1dc8`](https://github.com/druxt/druxt.js/commit/31f1dc84819c4ec1c0a82696b335a333d7b9f4a0))
- An ESM axios hoisted into the site no longer breaks the dev server, because the Nuxt module adds axios to `build.transpile`. Sites need axios 0.34.0 or later. ([#658](https://github.com/druxt/druxt.js/issues/658), [`11c5516`](https://github.com/druxt/druxt.js/commit/11c5516875ccadfd00cd61cc644b474b1607d056))
- A module rebuilds its wrapper's props when its own props change, without fetching again, so a reused `DruxtField` given a form schema renders the form. ([#871](https://github.com/druxt/druxt.js/issues/871), [`17811be`](https://github.com/druxt/druxt.js/commit/17811bec3bed6e47ee44d8616d5ef9503ed5df34))
- `druxt/flushCollection` and `druxt/flushResource` now delete the data they name. Some payloads removed nothing at all. ([#881](https://github.com/druxt/druxt.js/issues/881), [`e485374`](https://github.com/druxt/druxt.js/commit/e485374a23630c314fc03a0abb0f04edb1c5f2fe))
  - Pass a `prefix` with a `type` to flush that prefix for every stored query of the type.
  - Pass the collection's `query` in place of its `hash`. Druxt hashes it the way `getCollection` does.
  - Flushing a type that holds nothing is a no-op, where it used to throw.

  ```js
  // Every stored node--article query in the `en` prefix.
  this.$store.commit('druxt/flushCollection', { type: 'node--article', prefix: 'en' });
  // One collection, named by the query that fetched it.
  this.$store.commit('druxt/flushCollection', { type: 'node--article', query });
  ```

  `druxt/getResource` with `bypassCache` now fetches every requested field and returns the included resources from the fresh response. Reading a flushed resource with `include` used to throw.

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
