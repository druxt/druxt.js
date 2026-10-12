<img src="https://raw.githubusercontent.com/druxt/druxt.js/HEAD/packages/views/banner.svg" alt="DruxtViews renders Drupal Views with filters, pagination and sorting">

# DruxtViews

[![npm](https://badgen.net/npm/v/druxt-views)](https://www.npmjs.com/package/druxt-views)
[![dev](https://badgen.net/npm/v/druxt-views/dev)](https://www.npmjs.com/package/druxt-views/v/dev)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> Drupal Views components for Druxt with support for filters, pagination and sorting.

DruxtViews renders Drupal Views in Nuxt through the
[JSON:API Views](https://www.drupal.org/project/jsonapi_views) module. A
View's results, exposed filters, sorts and pagers all come across; results
render as DruxtEntity components, and every part themes through the Druxt
component suggestion system.

![Example DruxtView page component](https://druxtjs.org/images/druxt-views-page.png)

## Features

- Vue.js components:
  - **DruxtView** renders a Drupal View by display as DruxtEntity components
- **View page routing and Blocks** with Druxt module integrations
- **Druxt settings** filter JSON:API fields
- **@nuxtjs/Storybook** integration

---

## Installation

> Included with [`druxt-site`](https://druxtjs.org/modules/site). Install it separately only when composing modules yourself.

1. Install the package:

   ```sh
   npm i druxt-views
   ```

2. Add the module to `nuxt.config.js`:

   ```js
   export default {
     modules: ['druxt-views'],
   };
   ```

---

### Development releases

Every change merged to `develop` is published under the `dev` tag:

```sh
npm i druxt-views@dev
```

These are unreleased builds. See [development releases](https://druxtjs.org/how-to/use-development-releases) before using one.

## Vue.js components

### DruxtView

Renders a Drupal View using DruxtEntity components, using data provided by the Drupal JSON:API Views module.

```vue
<DruxtView :display-id="displayId" :view-id="viewId" />
```

- For more details, refer to the [DruxtView API documentation](https://druxtjs.org/api/packages/views/components/DruxtView).

---

## Settings

### Reducing Views data

The default behaviour of the Views module is to retrieve all available fields from the JSON:API, for all results.

This behaviour is configurable using the modules `query` option, allowing for manually filtered `fields`, as well as automatic filtering with the `bundleFilter` option.

The default behaviour can be set via `nuxt.config.js`:

```js
export default {
  druxt: {
    views: {
      query: {
        bundleFilter: true,
      },
    },
  },
};
```

| Option                | Type       | Required | Default | Description                                                                                  |
| --------------------- | ---------- | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `query.bundleFilter`  | `boolean`  | No       | `false` | Whether to automatically detect Resource types to filter, based on the View `bundle` filter. |
| `query.fields`        | `string[]` | No       | `[]`    | An array of fields to filter from the JSON:API Views Resource types.                         |
| `query.resourceTypes` | `string[]` | No       | `[]`    | An array of Resource types to be used by the Fields filter.                                  |

---

## Router support

The DruxtViews module provides a **DruxtRouterView** component that is used by the Druxt Router module to render View page routes.

- For more details, see the [Druxt Router module](https://druxtjs.org/modules/router).

---

## Views pages

A Views page whose URL is its state. Declare the page's route pattern under `druxt.views.pages`, and the module registers a route for it ahead of the Druxt router's wildcard, rendered by the **DruxtViewsPage** component. The route gives the view its contextual arguments, exposed filters, sort and page, and every change the view reports is written back to the URL through the router. Back and forward replay as model changes, and nothing reloads.

```js
// nuxt.config.js
export default {
  druxt: {
    views: {
      pages: {
        '/shop/:collection?': {
          viewId: 'products',
          displayId: 'page_1',
          arguments: ['collection'],
          filters: { brand: { query: 'brand' } },
          page: 'page',
          sort: 'sort',
          history: 'replace',
          aliases: {
            collection: { women: '12', books: '11+12+13' },
            brand: { centarro: '3' },
          },
        },
      },
    },
  },
};
```

| Key         | Default   | What it does                                                                                                          |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| `viewId`    |           | The View ID.                                                                                                          |
| `displayId` | `default` | The View display ID.                                                                                                  |
| `arguments` | `[]`      | Route parameter names, in `views-argument` order. A missing optional parameter is sent as `all`.                      |
| `filters`   | `{}`      | Exposed filter identifier to `{ param }` (a route parameter) or `{ query }` (a query key, the identifier by default). `multiple: true` takes several values, joined with `+` in a path segment. |
| `page`      | `page`    | The query key for the page.                                                                                           |
| `sort`      | `sort`    | The query key for the exposed sort.                                                                                   |
| `history`   | `replace` | `replace` or `push`, how a change reaches the browser's history.                                                      |
| `aliases`   | `{}`      | Per argument or filter, the word the URL uses for each id. An id with no word is written as itself.                   |

`/shop/women?brand=centarro&page=2` renders the view with `views-argument[0]=12`, `views-filter[brand]=3` and `page=2`. Picking another brand replaces the URL and makes one request. With `filters: { brand: { param: 'brand', multiple: true } }` and the pattern `/shop/:collection?/:brand?`, the same page is `/shop/women/centarro`, two brands are `/shop/women/centarro+centorium`, and a brand with no collection is `/shop/all/centarro`: an earlier empty segment is written as `all`, which Views reads as its exception value. The pager's links keep the pattern. A `DruxtView` given a `value` prop uses it instead of the route and emits `input` on every model change, which is how the page drives it. Without a value nothing changes.

The `aliases` map is static. The 2.0.0 version of this module should take slugs from the JSON:API Views resource instead.

---

## Storybook

DruxtViews provides zero-config, auto-generated Storybook integration with a live data connection to your Druxt backend.

- For more details, see the [Storybook guide](https://druxtjs.org/how-to/storybook).

---

## Options

### Druxt Views options

These options are specific to this module.

| Option                      | Type       | Required | Default | Description                                                                                  |
| --------------------------- | ---------- | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `views.query.bundleFilter`  | `boolean`  | No       | `false` | Whether to automatically detect Resource types to filter, based on the View `bundle` filter. |
| `views.query.fields`        | `string[]` | No       | `[]`    | An array of fields to filter from the JSON:API Views Resource types.                         |
| `views.query.resourceTypes` | `string[]` | No       | `[]`    | An array of Resource types to be used by the Fields filter.                                  |

### Base Druxt options

These options are available to all Druxt modules.

| Option    | Type     | Required | Default | Description                                                                  |
| --------- | -------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `axios`   | `object` | No       | `{}`    | [Axios instance settings](https://github.com/axios/axios#axioscreateconfig). |
| `baseUrl` | `string` | Yes      | `null`  | Base URL for the Drupal installation.                                        |

## Links

- DruxtJS: https://druxtjs.org
- Documentation: https://druxtjs.org/modules/views
- Community Discord server: https://discord.druxtjs.org
