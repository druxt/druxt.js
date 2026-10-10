# druxt-schema

## 0.12.0 - 2026-10-10

### Minor Changes

- Schemas can follow display changes in Drupal without a rebuild. With `druxt.schema.refresh`, the Nuxt server regenerates a schema the first time a page needs it and holds it until the next cache clear. The browser fetches it from the server at `/_druxt/schema/<id>`, and the schema from the build is used whenever regeneration fails. Under `nuxt dev` each request regenerates, as there is no cache to clear. A static site keeps the schemas from its build, unless its own Node server serves the route with `createSchemaRefresh`. ([`b07a3e3`](https://github.com/druxt/druxt.js/commit/b07a3e3b4e1521a97ba4d5187c260432dadf47ac))
  `druxt/clearCache` now also flushes the stored schemas.
- Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch. ([`46e77f7`](https://github.com/druxt/druxt.js/commit/46e77f7adc61e35d5a4c43595ca2ba8b647f17cb))

### Patch Changes

- Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before. ([`14dca08`](https://github.com/druxt/druxt.js/commit/14dca0820203f9b1e7bec186f47f379cc245375f))
- Updated dependencies. ([#698](https://github.com/druxt/druxt.js/issues/698), [`a1d6708`](https://github.com/druxt/druxt.js/commit/a1d6708030851bfbde74a1986e4f4cd918793917))
- Schema resource collections are now cached per client and process, keyed by resource type and query, and concurrent requests for one collection share a fetch. ([`43ddd7b`](https://github.com/druxt/druxt.js/commit/43ddd7b7b59be0a76fd98a715857fd64f60be9b4))
- The README banner renders on npm. `repository.directory` only changes the Repository link on the npm page, so npm's registry still resolved a relative image path against the monorepo root, where the banner does not exist. Each package's banner is now an absolute URL naming its own directory. ([`d963bcb`](https://github.com/druxt/druxt.js/commit/d963bcb01735d539fb29deb436ab65ef875f2b1e))
- The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist. ([`a8f4ed6`](https://github.com/druxt/druxt.js/commit/a8f4ed6ce6c0630e59ba7ffa9e5b666b1f32a821))
- Updated dependencies: druxt@0.25.0.

## 0.11.3 - 2023-07-25

### Patch Changes

- Updated dependencies: druxt@0.23.0.

## 0.11.2 - 2023-07-05

### Patch Changes

- Updated dependencies: druxt@0.22.0.

## 0.11.1 - 2022-11-03

### Patch Changes

- Updated dependencies: druxt@0.21.0.

## 0.11.0 - 2022-08-12

### Minor Changes

- Added a permission check to schema generation, part of the fix for permission-restricted blocks breaking DruxtSite page renders. ([#543](https://github.com/druxt/druxt.js/issues/543), [`49b6787`](https://github.com/druxt/druxt.js/commit/49b67872))

### Patch Changes

- Updated dependencies: druxt@0.20.0.

## 0.10.4 - 2022-05-23

### Patch Changes

- Updated dependencies: druxt@0.19.0.

## 0.10.3 - 2022-04-14

### Patch Changes

- Updated drupal-jsonapi-params to 2.0.0. ([`540afca`](https://github.com/druxt/druxt.js/commit/540afca))
- Updated dependencies: druxt@0.18.2.

## 0.10.2 - 2022-02-23

### Patch Changes

- Added support for the @nuxtjs/axios module. ([#63](https://github.com/druxt/druxt.js/issues/63), [`e3d5238`](https://github.com/druxt/druxt.js/commit/e3d5238c))
- Added error if no schema files are generated. ([`de8fc92`](https://github.com/druxt/druxt.js/commit/de8fc92))
- Updated dependencies: druxt@0.18.0.

## 0.10.1 - 2022-02-07

### Patch Changes

- Updated dependencies: druxt@0.17.0.

## 0.10.0 - 2022-01-12

### Minor Changes

- Added fallback to 'default' if schema view mode is missing. ([`87ec487`](https://github.com/druxt/druxt.js/commit/87ec487))

## 0.9.3 - 2021-12-30

### Patch Changes

- Updated dependencies: druxt@0.16.0.

## 0.9.2 - 2021-12-11

### Patch Changes

- Updated dependencies: druxt@0.15.0.

## 0.9.1 - 2021-12-04

### Patch Changes

- Updated dependencies: druxt@0.14.0.

## 0.9.0 - 2021-11-10

### Minor Changes

- Disabled API Proxy when generating schema files. ([`77ab204`](https://github.com/druxt/druxt.js/commit/77ab204))

### Patch Changes

- Added missing schemaType prop to DruxtSchemaMixin. ([`d12dfb5`](https://github.com/druxt/druxt.js/commit/d12dfb5))
- Updated dependencies: druxt@0.13.0.

## 0.8.1 - 2021-10-10

### Patch Changes

- Updated dependencies: druxt@0.12.0.

## 0.8.0 - 2021-09-29

### Minor Changes

- Added module-level options. ([`dae345e`](https://github.com/druxt/druxt.js/commit/dae345e))

### Patch Changes

- Updated dependencies: druxt@0.11.0.

## 0.7.10 - 2021-09-19

### Patch Changes

- Updated dependencies: druxt@0.10.0.

## 0.7.9 - 2021-09-14

### Patch Changes

- Fixed dependencies. ([`c4616df`](https://github.com/druxt/druxt.js/commit/c4616df))

## 0.7.8 - 2021-09-13

### Patch Changes

- Updated dependencies: druxt@0.9.0.

## 0.7.7 - 2021-06-08

### Patch Changes

- Fixed issue with inconsistent schemas.

## 0.7.6 - 2021-05-24

- No release notes were recorded for this version.

## 0.7.5 - 2021-05-24

- No release notes were recorded for this version.

## 0.7.4 - 2021-04-27

- No release notes were recorded for this version.

## 0.7.3 - 2021-04-27

- No release notes were recorded for this version.

## 0.7.2 - 2021-03-29

### Patch Changes

- Updated get() query.

## 0.7.1 - 2021-03-02

### Patch Changes

- Updated Nuxt module.

## 0.7.0 - 2021-02-09

### Minor Changes

- Refactored to use DruxtClient.

## 0.6.2 - 2021-01-12

### Patch Changes

- Added support for more than 50 schemas.

## 0.6.1 - 2021-01-08

### Patch Changes

- Updated dependencies.

## 0.6.0 - 2020-10-08

### Minor Changes

- Removed auth functionality.
- Updated dependencies.

## 0.5.1 - 2020-08-28

### Patch Changes

- Fixed dependencies.

## 0.5.0 - 2020-08-27

### Minor Changes

- Refactored to use Nuxt fetch hook.

## 0.4.0 - 2020-06-30

### Minor Changes

- Added support for remapped resources.

## 0.3.0 - 2020-06-12

### Minor Changes

- Added support for custom endpoint.
- Added message to Nuxt build.

## 0.2.0 - 2020-05-17

### Minor Changes

- Added ability to filter require schemas.

## 0.1.0 - 2020-05-04

### Initial release
