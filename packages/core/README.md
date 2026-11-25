<img src="https://raw.githubusercontent.com/druxt/druxt.js/HEAD/packages/core/banner.svg" alt="Druxt: the core module, client, store and module contract">

# @druxt/core

[![npm](https://badgen.net/npm/v/@druxt/core)](https://www.npmjs.com/package/@druxt/core)
[![dev](https://badgen.net/npm/v/@druxt/core/dev)](https://www.npmjs.com/package/@druxt/core/v/dev)
[![CI](https://github.com/druxt/druxt.js/actions/workflows/ci.yml/badge.svg)](https://github.com/druxt/druxt.js/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/druxt.js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/druxt.js?targetFile=package.json)
[![codecov](https://codecov.io/gh/druxt/druxt.js/graph/badge.svg)](https://codecov.io/gh/druxt/druxt.js)

> The Druxt module for Nuxt 4: the configured client, the store and the module contract.

`@druxt/core` is the Nuxt module every other Druxt module builds on. It provides the three pieces the whole framework shares:

- **[DruxtClient](#druxtclient)**: the `@druxt/client` JSON:API client, configured from `druxt`. `useDruxtClient()` gives it to components.
- **[DruxtStore](#druxtstore)**: the Pinia store that caches resources and collections for all modules, from `useDruxtStore()`.
- **[DruxtModule](#druxtmodule)**: `useDruxtModule()`, the contract behind the theme-component suggestion system.

## Installation

1. Install the package:

   ```sh
   npm i @druxt/core
   ```

2. Add the module and your backend URL to `nuxt.config.ts`:

   ```ts
   export default defineNuxtConfig({
     modules: ['@druxt/core'],
     druxt: {
       baseUrl: 'https://api.umami.demo.druxtjs.org',
     },
   });
   ```

   \* _Replace `https://api.umami.demo.druxtjs.org` with your own Drupal backend._

3. On the Drupal side, install and enable the [Druxt module](https://www.drupal.org/project/druxt). Grant the **access druxt resources** permission to the relevant roles. Missing this is the most common cause of site-wide JSON:API failures. See [Troubleshooting](https://druxtjs.org/how-to/troubleshooting) if requests are failing after install.

### Development releases

Every change merged to a release line is published under the `dev` tag:

```sh
npm i @druxt/core@dev
```

These are unreleased builds. See [development releases](https://druxtjs.org/how-to/use-development-releases) before using one.

## Quick start

With the module installed, a page reads Drupal through the client:

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
const druxt = useDruxtClient();
const { data: recipes } = await useAsyncData('recipes', () =>
  druxt.getCollection('node--recipe', { 'page[limit]': 3 }),
);
</script>

<template>
  <ul>
    <li v-for="recipe in recipes?.data" :key="recipe.id">{{ recipe.attributes?.title }}</li>
  </ul>
</template>
```

`getCollection()` returns the JSON:API document, so the resources are in `recipes.data`.

## Requirements

Nuxt 4.4.4 or later in the 4.x line, and Vue 3.5.

Nuxt 4.4 is the last minor on vite 7. Nuxt 4.5 and later need vite 8. So an integration that caps vite at 7 holds a site on Nuxt 4.4.

## Compatibility

|               | Supported                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nuxt          | 4.4.4 or later in the 4.x line. CI tests 4.4.4 and the workspace's own Nuxt.                                                                                                                                          |
| Vue           | 3.5                                                                                                                                                                                                                   |
| Vite          | 7 on Nuxt 4.4, 8 on Nuxt 4.5 and later, as Nuxt requires.                                                                                                                                                             |
| Node          | 22.19 or later in 22, 24.11 or later in 24, or 26 and later, as Nuxt 4 requires. Tested on 24.                                                                                                                        |
| Drupal core   | 10 or 11. `drupal/druxt` 1.2.2 declares `^10 \|\| ^11 \|\| ^12` and ended 8 and 9 support. 12 is declared but waits on Decoupled Router and JSON:API Menu Items. Tested against 10 and 11.                            |
| Drupal module | `drupal/druxt` ^1.2.2, which brings `decoupled_router`, `jsonapi_menu_items` and `jsonapi_views`. Earlier 1.2.x releases are incompatible with Decoupled Router 2.0.7 ([#3618675](https://www.drupal.org/i/3618675)). |

What these bounds promise over time is stated in the [support and versioning policy](https://druxtjs.org/explanation/support-and-versioning).

Translated routes also need a `decoupled_router` patch. See the [multilingual guide](https://druxtjs.org/how-to/multilingual).

## Settings

The options go in the `druxt` block of `nuxt.config.ts`.

| Option                 | Type                   | Default                 | Description                                                                                                                                     |
| ---------------------- | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`              | `string`               |                         | The Drupal backend URL. **Required.**                                                                                                           |
| `endpoint`             | `string`               | `'/jsonapi'`            | The JSON:API endpoint path. `api`, `/api` and `/api/` are one path.                                                                             |
| `siteUrl`              | `string`               | `''`                    | The site's public origin, for its canonical link. Unset, the request's origin is used. Set it in production. Also `NUXT_PUBLIC_DRUXT_SITE_URL`. |
| `filesUrl`             | `string`               | `''`                    | The origin Drupal's files are served from, such as a CDN's. Unset, `baseUrl` is used. See [File URLs](#file-urls).                              |
| `proxy.api`            | `boolean`              | `false`                 | Proxy API requests via Nuxt ([guide](https://druxtjs.org/how-to/proxy)). See [Proxy](#proxy).                                                   |
| `proxy.files`          | `boolean\|string`      | `false`                 | Proxy Drupal files. A string sets the site, for a multi-site's directory.                                                                       |
| `proxy.trustForwarded` | `boolean`              | `false`                 | Pass on a front proxy's forwarding headers. Server only. See [Proxy](#proxy).                                                                   |
| `cache`                | `false\|object`        | On in production        | The server cache. `false` turns it off. Development runs without it. See [Server cache](#server-cache).                                         |
| `auth`                 | `object`               | Off                     | Signs visitors in through Drupal's Simple OAuth module, as [Signing in](#signing-in) describes.                                                 |
| `classes`              | `boolean\|object`      | `true`                  | Which of Druxt's classes the default output has. See [Classes](#classes).                                                                       |
| `anchors`              | `boolean\|'dev'`       | `'dev'`                 | Whether the default output has its anchors. Read at build. See [Anchors](#anchors).                                                             |
| `develMessages`        | `'devtools'\|'inline'` | `'devtools'`            | Where development says a module has no wrapper. See [Development tools](#development-tools).                                                    |
| `static`               | `boolean\|object`      | Follows `nitro.static`  | The static mode, for a site served with no Drupal at run time, as [Static builds](#static-builds) describes.                                    |
| `build.auth`           | `object`               |                         | The credentials for build-time requests. See [Build credentials](#build-credentials).                                                           |
| `editing`              | `object`               | See [Editing](#editing) | Whether the site offers editing, and where a draft saves to.                                                                                    |
| `connections`          | `object`               |                         | Reserved for a later release. The module warns about each entry and ignores it.                                                                 |

Each other Druxt module reads its own key, such as `druxt.router`. See the [Nuxt module API](https://druxtjs.org/api/packages/core/module) for the full options list.

The module stops the build when `baseUrl` is empty. It warns about an unknown `develMessages` or `anchors` value, and uses the default.

A page in a build without the Druxt modules reaches the client through `useNuxtApp().$druxt`. Auto-imports such as `useDruxtClient()` exist only when the module is registered.

### Composables

The module auto-imports these in the app:

| Composable                                       | What it gives                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `useDruxtClient()`                               | The configured [DruxtClient](#druxtclient).                                                                                     |
| `useDruxtStore()`                                | The [DruxtStore](#druxtstore).                                                                                                  |
| `useDruxtSettings(connection?)`                  | The resolved settings. See [Configuration](#configuration).                                                                     |
| `setDrupalSettings(connection, tiers, options?)` | Nothing. It sets Drupal's settings for one request. See [Settings from Drupal](#settings-from-drupal).                          |
| `useDruxtLanguages()`                            | `{ languages, defaultLangcode }`. See [Languages](#languages).                                                                  |
| `useDruxtFileUrl()`                              | A function that resolves a file URL: `(url) => { url, rewritten }`. See [File URLs](#file-urls).                                |
| `defineDruxtClasses(hook)`                       | Nothing. It registers a hook that rewrites class lists. See [Classes](#classes).                                                |
| `useDruxtClasses()`                              | A function that gives the classes for an element: `(ctx) => string[]`.                                                          |
| `useDruxtAnchors()`                              | The anchors state: `{ enabled, requiredBy, disabledBy }`. See [Anchors](#anchors).                                              |
| `useDruxtEditStore()`                            | The store of drafts. See [The edit store](#the-edit-store).                                                                     |
| `useDruxtEditing(target?)`                       | `{ enabled, signedIn, permission }`. See [Permission and controls](#permission-and-controls).                                   |
| `useDruxtModule(props, contract)`                | A module's render function. See [DruxtModule](#druxtmodule).                                                                    |
| `useDruxtModuleContext()`                        | The context of the module a component renders in, or `undefined` outside one.                                                   |
| `druxtModuleProps`, `druxtModuleEmits`           | The props and the emits every module declares.                                                                                  |
| `useDruxtPageTitle()`                            | `{ owner, claim(owner) }`, for the component that renders the page's `h1`.                                                      |
| `useDruxtDevtools()`                             | `section()`, `event()`, `action()`, `note()` and `removeNote()`. See [Extending the tools](#extending-the-tools-from-a-module). |
| `useDruxtAuth()`                                 | The sign-in state and actions. Only with `druxt.auth`. See [Signing in](#signing-in).                                           |
| `DRUXT_AUTH_SIGNED_IN`                           | The `name` of the error a sign-in rejects with while signed in. Only with `druxt.auth`.                                         |

On the server, `useDruxtServerSettings(event)` and `storeDrupalSettings(connection, tiers)` are auto-imported in Nitro. `useDruxtServerClient()` comes from `@druxt/core/server`.

### Components

| Component            | Props                                                | What it renders                                                                                                      |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `Druxt`              | `module`, `propsData`, `inner`, `wrapper`, `v-model` | Any Druxt module by name: `module="entity"` renders `DruxtEntity`. No element of its own unless `wrapper` names one. |
| `DruxtWrapper`       | `moduleAttrs`, `moduleTag`                           | A module's default output, when the site has no wrapper component for it.                                            |
| `DruxtDebug`         | `json`, `summary`, `visible`, `kind`                 | JSON data, formatted for reading, in development only.                                                               |
| `DruxtEditControls`  | `type`, `id`, `langcode`, `field`, `delta`           | An editing module's controls. See [Permission and controls](#permission-and-controls).                               |
| `DruxtAuthLogin`     | `redirect`                                           | The sign-in form. Only with `druxt.auth`. See [The sign-in form](#the-sign-in-form).                                 |
| `DruxtDevelTemplate` | `component`, `options`, `props`, `slots`, `template` | The development tool that creates a wrapper component. It renders nothing in a production build.                     |

### Entry points

These entry points do not import a framework, so they run on the server, in the browser and outside Nuxt:

| Import                | Holds                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| `@druxt/core/anchors` | The anchor attributes, `entityAnchors()`, `fieldAnchors()` and `findAnchor()` |
| `@druxt/core/classes` | The class naming rules and `resolveDruxtClasses()`                            |
| `@druxt/core/edit`    | The draft model                                                               |
| `@druxt/core/fields`  | `resolveEntityFields()`, which decides the fields an entity request asks for  |
| `@druxt/core/files`   | `resolveFileUrl()` and `resolveFileUrlsInHtml()`                              |
| `@druxt/core/markup`  | `filterFieldMarkup()`                                                         |
| `@druxt/core/routes`  | `DRUXT_API_BASE`, the path of Druxt's own server routes                       |

`@druxt/core/kit` has the build-time helpers for Druxt modules, such as `addDruxtDefaults()`, `addDruxtProxy()` and `requireDruxtAnchors()`. `@druxt/core/server` has the server's helpers.

## Configuration

The `druxt` block in `nuxt.config.ts` stays one flat object. The module splits it once, when the app builds, into three objects. Each has one owner:

| Object           | Holds                                                                                  | Where it lives                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Client options   | How to reach Drupal: `baseUrl`, `endpoint`, `proxy`, `cache` and the public `auth`     | Built for each side from the public config. The browser uses the proxy, the server does not. |
| Settings         | What modules read: `siteUrl`, `develMessages` and one key per module, such as `router` | `runtimeConfig.public.druxt`, read resolved through `useDruxtSettings()`                     |
| Private settings | `auth.clientSecret`, `cache.secret` and `build.auth.*`                                 | `runtimeConfig.druxt`, on the server only                                                    |

No secret reaches the public config, the client bundle or the payload.

Read the settings with `useDruxtSettings()`, never `useRuntimeConfig().public.druxt`. The settings leave out the client options and the credentials. The client's options are on `useNuxtApp().$druxt.options`:

```ts
const settings = useDruxtSettings();
if (settings.develMessages === 'inline') {
  // ...
}
```

A server route reads the settings with `useDruxtServerSettings(event)`, which adds the settings Drupal marks server only. A route that needs a secret reads the private `runtimeConfig.druxt`.

### Build credentials

`build.auth` signs the build in to Drupal, so it can read what an anonymous visitor cannot, such as restricted display configuration. It is read at build only.

| Option                    | Type     | Falls back to               | Description                                                                    |
| ------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------ |
| `build.auth.clientId`     | `string` | `DRUXT_BUILD_CLIENT_ID`     | The Simple OAuth Consumer the build signs in with.                             |
| `build.auth.clientSecret` | `string` | `DRUXT_BUILD_CLIENT_SECRET` | The Consumer's secret. With the client id, it is the client credentials grant. |
| `build.auth.username`     | `string` | `DRUXT_BUILD_USERNAME`      | A user name. With `password`, the build uses the password grant.               |
| `build.auth.password`     | `string` | `DRUXT_BUILD_PASSWORD`      | The user's password.                                                           |
| `build.auth.scope`        | `string` | `DRUXT_BUILD_SCOPE`         | The scope to ask for. A Simple OAuth token has no roles without a scope.       |

`build.auth.clientSecret`, when written in `nuxt.config`, stays in the build-time options for the build client. Other modules can read it at build time, so prefer the environment variable.

The server's own routes do not use the build's credentials. They read theirs at runtime. See [Environment variables](#environment-variables).

### Classes

`druxt.classes` decides which of Druxt's classes the default output has:

- `true`, the default, keeps every class.
- `false` keeps none.
- An object names the parts and modifiers to keep, such as `{ items: false, modifiers: ['field'] }`.

A plugin rewrites the classes with `defineDruxtClasses((classes, ctx) => classes)`. The hook runs on the server and in the browser alike, so it must return the same list for the same input.

The entity module's README lists every class and the policy's parts. The naming rules and `resolveDruxtClasses()` are in `@druxt/core/classes`.

`filterFieldMarkup(html)`, from `@druxt/core/markup`, filters the markup a field's settings hold, such as its description. It filters as Drupal's `FieldFilteredMarkup` does:

- It keeps the tags `a abbr b big code del em i ins pre q small span strong sub sup tt ol ul li p br img`.
- A `<script>` or `<style>` is removed with its content. Any other tag is removed, and its text is left.
- On a kept tag, only `href`, `title`, `alt`, `src` and `class` stay.
- `href` and `src` stay only for an `http`, `https` or `mailto` URL, or a path relative to the site. A protocol-relative `//host` URL never stays.

The result is safe to set as `innerHTML`. It does not use a DOM.

### Anchors

The default output names the entities and fields it renders with data attributes. An inline editor, a diff view or the site's tests find the elements again by them. `@druxt/core/anchors` holds the contract:

| Attribute             | Holds                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `data-druxt-entity`   | The entity's id, exactly as JSON:API returned it                                            |
| `data-druxt-type`     | The resource type, such as `node--recipe`                                                   |
| `data-druxt-langcode` | The entity's language, on an entity's root and a standalone field's, when Drupal returns it |
| `data-druxt-field`    | The field's public name, on each item                                                       |
| `data-druxt-delta`    | The item's index, on each item of a multi-value field                                       |

`entityAnchors()` and `fieldAnchors()` write them. `findAnchor()` finds an element again. Where there is nothing to search, it gives `null`, never an error:

```ts
import { findAnchor } from '@druxt/core/anchors';

const item = findAnchor(document, { entity: uuid, field: 'field_tags', delta: 1 });
```

`druxt.anchors` has three values:

- `'dev'`, the default: on in development, off in production.
- `true`: on everywhere.
- `false`: off everywhere.

A module that needs the anchors, such as an inline editor, turns them on in production with `requireDruxtAnchors()` from `@druxt/core/kit`:

```ts
import { requireDruxtAnchors } from '@druxt/core/kit';

const anchors = requireDruxtAnchors(nuxt, {
  module: '@druxt-contrib/fae',
  reason: 'it finds the fields an editor edits',
});
nuxt.hook('modules:done', () => {
  if (!anchors.enabled)
    logger.warn('Front-end editing is off: this site turned Druxt anchors off.');
});
```

- A site that sets `anchors: false` keeps them off, because explicit config wins over a module. The build then warns once for each requiring module, naming it and its reason.
- The state settles once every module is installed, so the order modules run in does not matter. A module reads it in a `modules:done` hook, as above.
- The `druxt:anchors` build hook receives the state too, as `{ enabled, requiredBy, disabledBy }`.
- Drupal's settings cannot change it.

In the app, `useDruxtAnchors()` gives the same state, so a module can tell its users:

```vue
<script setup lang="ts">
const { enabled } = useDruxtAnchors();
</script>

<template>
  <p v-if="!enabled">Front-end editing is off because this site disabled Druxt anchors.</p>
</template>
```

The Settings section of the development tools shows the state and the modules that required it.

### Environment variables

Set secrets at runtime, never in `nuxt.config.ts`, where they are part of the build.

| Variable                                                                                          | Sets                                      |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `NUXT_PUBLIC_DRUXT_SITE_URL`                                                                      | `siteUrl`                                 |
| `NUXT_PUBLIC_DRUXT_FILES_URL`                                                                     | `filesUrl`                                |
| `NUXT_PUBLIC_DRUXT_BASE_URL`                                                                      | `baseUrl`, after the build                |
| `NUXT_DRUXT_AUTH_CLIENT_SECRET`                                                                   | The confidential Consumer's secret        |
| `NUXT_DRUXT_CACHE_SECRET`                                                                         | The `POST /api/_druxt/cache/clear` secret |
| `NUXT_DRUXT_PROXY_TRUST_FORWARDED`                                                                | `proxy.trustForwarded`                    |
| `NUXT_DRUXT_BUILD_AUTH_CLIENT_ID`                                                                 | The server's own Consumer                 |
| `NUXT_DRUXT_BUILD_AUTH_CLIENT_SECRET`                                                             | The server's own Consumer's secret        |
| `NUXT_DRUXT_BUILD_AUTH_USERNAME`, `NUXT_DRUXT_BUILD_AUTH_PASSWORD`, `NUXT_DRUXT_BUILD_AUTH_SCOPE` | The server's password grant and scope     |

`DRUXT_AUTH_CLIENT_SECRET` and the `DRUXT_BUILD_*` variables still work when they are present at runtime.

### Proxy

With `proxy.api`, the browser reaches Drupal through the site's own origin. The proxy serves:

- The JSON:API, under each language's URL prefix.
- `/oauth/token` and `/oauth/userinfo`, when `druxt.auth` is set.
- The router's `/router/translate-path`, when `@druxt/router` is installed.
- The files directory, with `proxy.files`.

One server handler serves them all. It reads the base URL for each request, so `NUXT_PUBLIC_DRUXT_BASE_URL` set after the build moves the browser's requests and the server's together.

The request to Drupal:

- The method and the headers pass through, and the body streams through.
- `Host`, `Accept` and `Accept-Encoding` are not forwarded, so Drupal sees its own host. Nor is `Connection`, a header it names, or another header for one hop only, such as `TE` and `Proxy-Authorization`.
- `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto` are set from the site's own view of the request. Any forwarding header the browser sent is dropped, along with `Forwarded`, `X-Forwarded-Port`, `X-Forwarded-Server` and `X-Real-IP`.
- Of the browser's cookies, Drupal gets only its own session cookie: `SESS` or `SSESS` and a hash, or the one `cache.sessionCookie` matches. Druxt's `druxt.auth.*` cookies, another module's, such as nuxt-auth-utils' `nuxt-session`, and the site's own never reach Drupal. A request with none of Drupal's sends no `Cookie` header.
- When the site's server holds the sign-in, the proxy sends the access token from its cookie as the `Authorization` header. A request that sends its own header keeps it. The proxy doesn't add credentials to a request that sends `X-Druxt-Auth: none`. A token cookie that does not decode, such as a bare `%`, counts as none, and the request goes to Drupal anonymously.

The response to the browser:

- A redirect passes through to the browser. A `Location` on Drupal's base URL becomes the same path on the site, always a path that starts with one `/`. A `Location` on another host is left as it is, as any reverse proxy leaves it, so the browser follows Drupal's redirect off the site.
- A cookie Drupal sets for its own host is set for the site's host.
- The response's encoding and length headers are recomputed. The others come back as Drupal sent them.

#### Behind a front proxy

Behind a front proxy, such as a hosting platform's nginx, Drupal sees that proxy as every visitor. Its flood control counts them as one. Set `proxy.trustForwarded`, or `NUXT_DRUXT_PROXY_TRUST_FORWARDED=true` at runtime, to pass the front proxy's headers on:

- The visitor's address is added to the front proxy's `X-Forwarded-For` chain.
- Its `X-Forwarded-Host`, `X-Forwarded-Proto` and the other forwarding headers pass through.

It is safe only when a front proxy the site trusts sets those headers on every request. Otherwise a browser can forge them. It is server only, in the private runtime config.

#### Druxt's own routes

Druxt's own server routes sit under `/api/_druxt`, such as `/api/_druxt/cache/clear` and `/api/_druxt/auth/token`, in Nitro's `/api` namespace. Modules read the path from `DRUXT_API_BASE`, in `@druxt/core/routes` and `@druxt/core/kit`.

Many Drupal sites serve JSON:API at `/api`. Set `endpoint: '/api'` with `proxy.api` on, and the proxy takes `/api/**`. Druxt's routes and the site's own `server/api` routes answer first, so Drupal never sees them.

- A path under `/api/_druxt` never reaches Drupal. One that no Druxt route takes, such as a `GET` to the `POST` token route, answers 404, where a proxy at `/api/**` would otherwise take it.
- A route of the site's, or of another module, answers only its own methods. A request to it with another method goes through the proxy to Drupal, such as a `GET` to a `POST`-only `server/api/login.post.ts`. Only Druxt's own paths answer 404 for one.
- A JSON:API endpoint at or under `/api/_druxt`, with or without a language prefix, fails the build with `DRUXT_E01006`.

### File URLs

Drupal gives a file's URL as a path on its own origin, such as `/sites/default/files/logo.png`. The default output resolves it with `resolveFileUrl()`, from `@druxt/core/files`:

- With `proxy.files` on, a path in the proxied files directory stays on the site.
- With it off, or for a path outside that directory, the path is made absolute on `druxt.filesUrl`. That is the origin Drupal's files are served from, such as a CDN's. Without it, the path is made absolute on `druxt.baseUrl`. `NUXT_PUBLIC_DRUXT_FILES_URL` sets `filesUrl` at runtime.
- A static build, as `nuxt generate` makes it, has no server to proxy the files. Its file URLs are absolute, unless `druxt.static.files` keeps a public file on the site, as [Static builds](#static-builds) describes. With `proxy.files` on and no `static.files`, the build warns once with `DRUXT_E01002`.

A wrapper resolves a file URL the same way with `useDruxtFileUrl()`, which is auto-imported. In development, a field notes a rewritten URL in the Druxt DevTools tab.

`resolveFileUrlsInHtml(html, resolve)` resolves each `src` and `href` under `/sites/<site>/files/` or `/system/files/` inside markup, such as an editor's inline image. It leaves the rest byte for byte.

### Languages

The JSON:API is proxied under each language's URL prefix as Drupal is configured, such as `/english/jsonapi` for `en`. The build reads the prefixes from Drupal:

- The default language's prefix comes from the unprefixed index. A default language with no prefix is served unprefixed.
- Each other language's prefix comes from a probe at its langcode.
- When the decoupled_settings module publishes `language.negotiation` to visitors, the build reads every prefix from it. That is the one way to learn a prefix that is neither the langcode nor the default language's.
- A prefix the build cannot read is taken to be the langcode, with a warning.

When the read fails:

- When Drupal refuses a production build's read of the languages, such as with the wrong build credentials, the build stops with `DRUXT_E01008`. The site would otherwise route and proxy only its default language.
- When Drupal does not answer, as in a build that cannot reach it, the build warns once and goes on with no languages.
- Any failure in development does the same, so the site starts while Drupal is away.

With no languages read, the proxy serves only the unprefixed endpoint. A request under a language prefix misses it until a build reads them.

The prefixes are read at build, so rebuild after changing them in Drupal. The client gets the same map, so a module's language reaches Drupal under the prefix it is served at.

In the app, `useDruxtLanguages()`, which is auto-imported, gives the same languages with their prefixes. It also gives `defaultLangcode`, the language served with no prefix. That is `undefined` when every language has a prefix.

```ts
const { languages, defaultLangcode } = useDruxtLanguages();
```

### Drupal's address in the pages

Nuxt writes the public runtime config into every page, and `druxt.baseUrl` is in it. When the browser has no use for that address, Druxt leaves it out. The page then holds only the path Drupal is served under, and the browser's client takes the site's own origin. The server keeps the whole address.

Druxt leaves it out when all of these hold:

- The browser does not send Drupal a request: the build is static and not `hybrid`, or `proxy.api` is on.
- The browser does not take a file from it: `druxt.filesUrl` is set, a static build copies its files with `static.files`, or a server proxies them with `proxy.files`.
- The site does not send a visitor to it to sign in: `druxt.auth` is not set, or on a server `auth.authorizeUrl` is set to an address of your own.

Otherwise the address stays in the pages, because the browser needs it.

With the address left out:

- `useRuntimeConfig().public.druxt.baseUrl` is not Drupal's address in the browser.
- A file outside Drupal's public files, such as a private file, needs `druxt.filesUrl` for its URL.

### Static builds

`druxt.static` is the static mode, for a site served with no Drupal at run time, as `nuxt generate` makes it.

- Unset, it follows `nitro.static`, which `nuxt generate` sets.
- `true`, or an object, turns it on.
- `false` turns it off.

| Option          | Type                             | Default | Description                                                                            |
| --------------- | -------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `static.routes` | `boolean\|Array<string\|RegExp>` | `true`  | Prerender Drupal's published pages. A list names the resource types to prerender.      |
| `static.files`  | `boolean`                        | `false` | Keep a public file's URL on the site, and copy each file a page names into the output. |
| `static.hybrid` | `boolean`                        | `false` | With `@druxt/router`, ask Drupal about a page the build did not generate.              |

The mode switches these together:

- File URLs are absolute on `druxt.filesUrl` or `druxt.baseUrl`. See [File URLs](#file-urls).
- The build prerenders Drupal's published pages.
- The build writes a prerender manifest, `/api/_druxt/prerender.json` under the app's `baseURL`. It lists the pages the build generated, and the redirect pages it wrote by source, such as the front page's alias.
- The public config marks the build static, with `files` and `hybrid`. `useDruxtStaticBuild()`, from `@druxt/core/settings`, reads it.

#### The pages a static build prerenders

- Each language's root is a page.
- So is every published node and taxonomy term of the types the JSON:API index lists. Each is under its language's URL prefix, at its alias when it has one, and otherwise at its system path.
- The pages are read through the build client. Unpublished content that a signed-in build may see is filtered out by status.
- A failed read stops the build, because the static site would be missing that type's pages. The error names each type and language the build could not list.
- `routes: false` turns the list off. The build then generates what Nitro's crawler reaches by following links, as a 0.x static build did.
- A list names the types to prerender, for a site that renders only some of them: `routes: ['node--article']`, or a RegExp such as `/^node--/`. A string that is not one of the site's node or taxonomy term types stops the build. A misspelt one would otherwise leave its pages out.
- The `druxt:prerender` build hook gets the set of paths before Nitro does. A module or the site's `nuxt.config.ts` adds paths to it, or removes them.
- Nitro's own `nitro.prerender.routes`, and the links it crawls, are added as usual.

A build has no visitor's session. So each page's content is read as an anonymous visitor reads it, whatever credentials the build listed the pages with. Display configuration and block placements are read with the build's credentials.

#### The manifest and the router

Core writes the manifest, and `@druxt/router` reads it. With the router:

- Client navigation reads a generated page's route from its payload, and follows a redirect page from the manifest. It doesn't send Drupal a request.
- A page the build did not generate answers 404, also with no request to Drupal. The manifest decides, because a static site's visitors may not reach Drupal at all. The build writes the app's `404.html`. Set the static host to serve that file for a path it has no file for. Some hosts do so by default, and others serve a 404 page of their own, which the router never sees. With it, the router gives the 404 on a hard load and on client navigation alike.
- `hybrid: true` has the router ask Drupal about such a page instead, for a static site beside a live Drupal. It answers 404 when Drupal cannot be reached.

Without the router, the site's own pages decide what an unbuilt path shows, and `hybrid` changes nothing.

#### Copying the files

`files: true` copies the files into the build:

- A path in Drupal's public files, under `/sites/<site>/files/`, stays on the site, under the app's `baseURL`.
- Once the pages are written, the build copies each file a page names, in its HTML or its payload, into the output. It reads the file from `druxt.filesUrl` or `druxt.baseUrl`.
- An image style's file is made as it is copied.
- A file Drupal does not answer is left out, with `DRUXT_E01005`.
- A private file, under `/system/files/`, stays absolute on Drupal.

In development, turn on `proxy.files` so the development server serves the same paths.

```js
export default defineNuxtConfig({
  druxt: {
    baseUrl: 'https://drupal.example.com',
    static: { files: true },
  },
  hooks: {
    // Leave Drupal's user pages out of the static build.
    'druxt:prerender'(routes) {
      for (const route of routes) if (route.startsWith('/user/')) routes.delete(route);
    },
  },
});
```

### Settings from Drupal

A decoupled-settings module can publish settings from Drupal for a frontend's Consumer. Core does not fetch them. A fetcher module hands them to core in two tiers:

- **Public**: settings for the browser. `useDruxtSettings()` reads them from Nuxt state, so they reach the payload.
- **Server**: settings Drupal marks server only. They stay in Nitro's `druxt` storage and on the request, and never reach the browser.

`useDruxtSettings()` resolves the defaults, then the public tier, then the config. So `nuxt.config.ts` and the environment always win over Drupal. A config key left `undefined` or empty does not erase a value from Drupal. Without a fetcher, both tiers are empty and nothing changes.

A fetcher stores both tiers at server start, and while `nuxt generate` builds static pages, from a Nitro plugin:

```ts
// server/plugins/drupal-settings.ts
import { useDruxtServerClient } from '@druxt/core/server';
// The fetcher's own reader, which splits what Drupal returns into the two tiers.
import { readDrupalSettings } from './read-drupal-settings';

export default defineNitroPlugin(async () => {
  const client = await useDruxtServerClient();
  const { publicSettings, serverSettings } = await readDrupalSettings(client);
  await storeDrupalSettings('default', { public: publicSettings, server: serverSettings });
});
```

- A call with one tier keeps the other.
- Calls for one connection write one after another. So two that overlap, such as one per tier, keep both.
- That holds within one server process. Instances that share a storage driver each write on their own, so store both tiers in one call there.

To set the settings for one request during a server render, the fetcher calls `setDrupalSettings()` from a server-only plugin:

```ts
// plugins/drupal-settings.server.ts
export default defineNuxtPlugin(async () => {
  // Fresh values for this request, over what the Nitro plugin above stored.
  const { publicSettings, serverSettings } = await readDrupalSettings(useDruxtClient());
  setDrupalSettings('default', { public: publicSettings, server: serverSettings });
});
```

- The public tier is merged over the stored one. A key stored at server start stays unless the request's tier sets it. Objects merge key by key, and arrays are replaced.
- Pass `{ replace: true }` as the third argument to replace the stored public tier instead.
- The server tier goes on the request, in place of the stored one.
- Pass a server tier only from a server-only plugin or `storeDrupalSettings()`. A universal plugin's source is bundled for the browser, server tier and all, even though the browser drops the value.

Every settings function takes a connection name, `default` unless named. Other connections, in `druxt.connections`, are reserved for a later release. The module warns about any other name and uses the flat keys.

### Writing a settings fetcher

Core has no option for the Consumer whose decoupled settings are read, because not every site uses them.

- A module that integrates Drupal's decoupled settings registers its own option with `addDruxtDefaults()` from `@druxt/core/kit`, such as `druxt.site.settingsConsumerId`.
- When the site leaves the option unset, the module falls back to the connection's Consumer, which the client exposes as `consumer.id`.
- The module writes what it reads with `storeDrupalSettings()`, as above.

## Signing in

`druxt.auth` signs visitors in to Drupal through Simple OAuth, with `useDruxtAuth()` and the `DruxtAuthLogin` component:

```ts
export default defineNuxtConfig({
  druxt: {
    baseUrl: 'https://drupal.example',
    auth: { clientId: 'my-site', password: true },
  },
});
```

| Option                  | Type            | Default                         | Description                                                                                            |
| ----------------------- | --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `auth.clientId`         | `string`        |                                 | The Simple OAuth Consumer's client id. **Required** with `auth`.                                       |
| `auth.clientSecret`     | `string`        |                                 | The Consumer's secret. Prefer `NUXT_DRUXT_AUTH_CLIENT_SECRET` at runtime.                              |
| `auth.passwordClientId` | `string`        |                                 | The client id of a Consumer of its own for the password grant.                                         |
| `auth.scope`            | `string`        |                                 | The scopes a signed-in visitor needs, separated by spaces. See [Scope](#scope).                        |
| `auth.authorizeUrl`     | `string`        | `/oauth/authorize` on `baseUrl` | Where a visitor is sent to sign in on Drupal.                                                          |
| `auth.login`            | `string\|false` | `'/user/login'`                 | The path of the login page the build adds. `false` adds none. See [Signed-in pages](#signed-in-pages). |
| `auth.callback`         | `string`        | `'/callback'`                   | The path of the authorization code grant's callback page.                                              |
| `auth.password`         | `boolean`       | See below                       | Whether the username and password sign-in is offered.                                                  |
| `auth.exposeToken`      | `boolean`       | `false`                         | Keep the tokens in cookies the page's scripts can read. See [Token cookies](#token-cookies).           |

`password` offers the username and password sign-in, through the `POST /api/_druxt/auth/token` route:

- Left unset, it is on when `auth.clientSecret` or `auth.passwordClientId` is set at build.
- Set `password: true` when the Consumer's secret arrives only at runtime, in `NUXT_DRUXT_AUTH_CLIENT_SECRET`, or when the Consumer is public and has no secret. The route adds the secret when one is set, and otherwise lets Drupal decide.
- `password: false` turns the password sign-in off. With `proxy.api` on, the route stays for the authorization code grant and the refresh, and refuses the password grant with a 400.

### Signed-in pages

The build adds two pages. A page the site already has at either path wins.

- A login page at `auth.login`, `/user/login` by default.
- The authorization code grant's callback page at `auth.callback`, `/callback` by default.

A page that only a signed-in visitor may see names the `druxt-auth` route middleware:

```ts
definePageMeta({ middleware: 'druxt-auth' });
```

A signed-out visitor goes to the login page instead, with the page they asked for in the `redirect` query. They come back there once signed in.

- `auth.login: false` leaves the login page out. The middleware then sends a signed-out visitor to `/login`, as druxt-auth 0.x did, so the site's own page there signs them in.
- For a login page of the site's at another path, set `auth.login` to that path.

### The sign-in form

`DruxtAuthLogin` signs a visitor in with a username and password, when `password` is on, or through Drupal's own sign-in page.

While the visitor is signed in, it shows who is signed in and a **Sign out** button in place of the form. It signs no one in: a visitor signs out before signing in as someone else.

- The server render reads the session's cookies. So a signed-in visitor never sees the form, not even before the page hydrates.
- Signing out reloads the page the visitor is on, which then shows the form.

```html
<div class="druxt-auth-login druxt-auth-login--signed-in">
  <p class="druxt-auth-login__user">Signed in as Editor.</p>
  <button type="button" class="druxt-auth-login__sign-out">Sign out</button>
</div>
```

To replace the markup:

- A `DruxtAuthLoginDefault` wrapper replaces the form, and a `DruxtAuthLoginSignedIn` wrapper replaces the signed-in state.
- Each takes the props it declares of `busy`, `capabilities`, `credentials`, `error`, `loggedIn`, `user`, `submit`, `signInWithDrupal` and `signOut`.
- A template in the component's default slot gets them all, and renders both states.
- `submit()` and `signInWithDrupal()` do nothing while the visitor is signed in, whatever markup calls them.

The pages keep the same rule:

- The login page sends a visitor who is already signed in on to the page in its `redirect` query, from the server.
- The callback page sends them on to the page the sign-in was for, and exchanges no code.

`useDruxtAuth()` keeps the same rule wherever a site calls it. While the visitor is signed in, `loginWithPassword()` and `loginWithDrupal()` send nothing to the token route or to Drupal, and the session and `user` stay as they are. They reject with an error whose `name` is `DRUXT_AUTH_SIGNED_IN`. The build auto-imports that constant with `useDruxtAuth()`. So a site tells the refusal from a failed sign-in by the name, never by the message:

```ts
const auth = useDruxtAuth();
try {
  await auth.loginWithPassword({ username, password });
} catch (error) {
  if ((error as Error).name !== DRUXT_AUTH_SIGNED_IN) throw error;
}
```

To sign in as someone else, sign out first. `await useDruxtAuth().logout('/user/login')` signs out and reloads the login page, which then shows the form.

### Scope

Set `auth.scope` to the scopes a signed-in visitor needs, separated by spaces.

On Simple OAuth 6, a token holds the roles its scopes name, and no others. Each scope grants one role, so the scope list is the role list. A sign-in with no scope gets a token with no roles. Drupal then refuses the signed-in editor what it gives an anonymous visitor, so the site can go blank with a 403.

- The build warns with `DRUXT_E01004` when browser sign-in is on and `auth.scope` is empty.
- In development, after a sign-in, a read that Drupal refuses the editor and gives an anonymous visitor adds a note to the Druxt DevTools tab. The note names `druxt.auth.scope`.

### Token cookies

With `proxy.api` on and `auth.exposeToken` off, the browser never holds a token:

- The token route keeps the access and refresh tokens in `httpOnly` cookies, which no script on the page can read.
- The proxy turns the access token into the `Authorization` header on each request it sends to Drupal.
- The browser reads only `druxt.auth.session`, which holds the access token's expiry and no token.
- `useDruxtAuth()` gives the signed-in state and the user, as before.

The cookies:

- They are on the site's own host, under the app's `baseURL`, with `SameSite=Lax`.
- They are `Secure` when `druxt.siteUrl` is https, or when the request came over https, which a front proxy names with `proxy.trustForwarded`. A development server on plain http sets no `Secure`.
- A server render reads the same cookies, so a signed-in page renders signed in.
- A session cookie that does not decode, such as a bare `%`, counts as none, for the proxy, the token route and the server render alike.

Signing in, refreshing and signing out:

- The password grant, the authorization code grant and the refresh all go through `POST /api/_druxt/auth/token`.
- A refresh uses the refresh token from its cookie, which only the server reads, and a refused refresh ends the session.
- A refresh rotates the refresh token, so a test script that keeps a copy of the browser's cookies from before a refresh finds that copy refused.
- Signing out goes through `POST /api/_druxt/auth/logout`, which clears the cookies.
- `useDruxtAuth()` does not start a sign-in while the browser has a session.
- A sign-in through the client itself, `$druxt.auth.loginWithPassword()`, ends the session the browser had as it asks Drupal, as druxt-auth 0.x did. A sign-in that Drupal refuses leaves the browser signed out, never signed in as the user before.

Requests from other sites:

- The token route and the logout route take requests from the site's own pages only.
- A request whose `Origin` header names another host answers 403. Drupal is not asked and no cookie is changed. So another site's form can neither sign a visitor in nor out.
- With no `Origin`, a `Sec-Fetch-Site` of another site is refused the same way.
- The site's host is the request's `Host`, or `druxt.siteUrl`'s when set. Behind a front proxy that sends another `Host`, set `druxt.siteUrl`, or `proxy.trustForwarded` for the proxy's `X-Forwarded-Host`. Otherwise every sign-in answers 403.

A token too large for a cookie:

- A browser keeps at most 4096 bytes of one cookie, counting its name, value and attributes. It drops a larger one without a word.
- When a token would make its cookie larger, the token route sets none of the new session's cookies. So a sign-in leaves the browser signed out.
- The route answers 502 with `DRUXT_E01007`, which names the token and its size. It logs the same line on the server.
- A refresh that answers such a token ends the session.
- Make Drupal's token smaller: fewer scopes or shorter-lived claims in the Simple OAuth token, or a smaller signing key.

A module that calls Drupal directly from the browser, outside the proxy, needs the token in the browser. `auth.exposeToken: true` keeps the tokens in cookies the page's scripts can read, as druxt-auth 0.x did. It is a weaker setting, because any script on the page can read the tokens. Without `proxy.api`, the browser calls Drupal itself, so the tokens are kept that way too.

### Beside nuxt-auth-utils

A site can sign visitors in with [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) as well as with `druxt.auth`. Each keeps its own session. Neither reads the other's cookies, and signing out of one leaves the other signed in.

|               | Druxt                                                                                        | nuxt-auth-utils                                               |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Routes        | `POST /api/_druxt/auth/token`, `POST /api/_druxt/auth/logout`, and the rest of `/api/_druxt` | `GET` and `DELETE /api/_auth/session`, and its OAuth handlers |
| Cookies       | `druxt.auth.*`, with the tokens `httpOnly` and the expiry in `druxt.auth.session`            | `nuxt-session`, sealed with `NUXT_SESSION_PASSWORD`           |
| In the app    | `useDruxtAuth()`, `DruxtAuthLogin`                                                           | `useUserSession()`, `AuthState`                               |
| On the server | The proxy adds the `Authorization` header                                                    | `getUserSession()`, `setUserSession()` and the other helpers  |

- The names do not overlap, so the build registers both modules' auto-imports.
- With `proxy.api` on and Drupal's JSON:API at `/api`, both modules' routes answer before the proxy.
- A request with a method a route does not take, such as a `GET` to a `POST`-only route of the site's, goes through the proxy to Drupal.
- The proxy sends Drupal only Drupal's own session cookie, so `nuxt-session` never reaches Drupal.

## Server cache

In production, the server keeps Drupal's responses between requests, for as long as Drupal's `Cache-Control` header allows. It keeps the JSON:API index, and with `cache.content` every other response.

Drupal sets that header from its page cache maximum age (Administration > Configuration > Development > Performance). So at the default of 0, nothing is kept.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  druxt: {
    cache: { content: true, secret: process.env.DRUXT_CACHE_SECRET },
  },
});
```

| Option                | Type      | Default             | Description                                                                                                             |
| --------------------- | --------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `cache.content`       | `boolean` | `false`             | Also keep entities, collections, views and route lookups.                                                               |
| `cache.maxSize`       | `number`  | `52428800` (50 MB)  | Bytes of responses kept per cache area, across its consumers. The least recently used go.                               |
| `cache.ttl`           | `number`  |                     | Seconds a response may be kept at most. `0` keeps nothing.                                                              |
| `cache.secret`        | `string`  |                     | Turns on `POST /api/_druxt/cache/clear`.                                                                                |
| `cache.sessionCookie` | `string`  | `'S?SESS[0-9a-f]+'` | A pattern for the session cookie name, for a proxy that renames it. The proxy sends Drupal only the cookies it matches. |

The cache keeps these:

- A request with an `Authorization` header, a Drupal session cookie or the site's own `druxt.auth.*` token cookie skips the cache. So a signed-in render reads Drupal.
- `nuxt dev` runs without the cache.
- Only successful responses are kept, each as text. Every reader gets a fresh copy.
- A read with `bypassCache` fetches afresh and stores the result. An older request that resolves after it never replaces it.
- A full cache area takes about three times `cache.maxSize` in server memory. A response larger than the limit is not kept.
- The modules' holds beside the cache, such as the schema, the date formats and the languages, are config. They are small, they are not bounded by `maxSize` and `ttl`, and the same clear drops them.
- A static build, as `nuxt generate` makes it, has no server, so none of this applies to it. The prerender manifest route is never cached.

After a write:

- An editor's save is a write Drupal accepts through the proxy. On this process, such a write drops the entries for that resource, for its type's collections and for the route lookups. So the next anonymous render reads the saved entity.
- It drops every JSON:API Views result too, under every language prefix, because a listing does not name the entities it shows. Any accepted `POST`, `PATCH` or `DELETE` to a JSON:API resource drops every cached view.
- A write Drupal refuses drops nothing.
- Another process's cache waits for Drupal's clear.

To clear the cache:

- Send `POST /api/_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The secret is `cache.secret`, which `NUXT_DRUXT_CACHE_SECRET` sets at runtime. The module bundles that route, and Drupal can call it.
- `useDruxtStore().clearCache()` is for the browser. It empties the page's own stores, and leaves the server cache as it is.
- Each Nuxt process has its own cache to clear.

The [caching guide](https://druxtjs.org/how-to/caching) covers the cache in more depth.

### Clearing from Drupal with Purge

With `cache.content` on, an edit reaches anonymous visitors on another process only when its cache entry ends, unless Drupal clears the cache. That takes up to the page cache maximum age, or `cache.ttl` if that is shorter.

The [Purge](https://www.drupal.org/project/purge) module can send that request on every save:

1. Enable `purge`, `purge_purger_http`, `purge_queuer_coretags` and a processor such as `purge_processor_lateruntime`.
2. Add the bundled HTTP purger:

   ```sh
   drush p:purger-add httpbundled
   ```

3. Give it the method `POST`, the Nuxt host and port, the path `/api/_druxt/cache/clear`, a header `X-Druxt-Secret` with the secret, and the invalidation type `tag`.

One save then costs one request, whatever it invalidates. A request refused for a wrong secret is sent again with the next batch.

Keep the secret out of exported configuration: set it from `settings.php` as a `$config` override.

A purger set up for a 1.x site sends `/_druxt/cache/clear`. Change its path to `/api/_druxt/cache/clear` when the site moves to 2.x, or the clear answers 404.

## DruxtClient

The client is the communication layer between your application and Drupal's JSON:API. Resources, collections, indexing and authentication all go through it.

In a component, `useDruxtClient()` gives the client the module configured:

```ts
const client = useDruxtClient();
const collection = await client.getCollection('node--article');
```

Outside Nuxt, construct one from `@druxt/client`:

```ts
import { DruxtClient } from '@druxt/client';

const client = new DruxtClient('https://api.umami.demo.druxtjs.org');
const collection = await client.getCollection('node--article');
```

- [Use the Druxt client directly](https://druxtjs.org/how-to/use-the-druxt-client): practical guide, including non-Nuxt usage.
- [DruxtClient API](https://druxtjs.org/api/packages/client/client): full method reference.

## DruxtStore

The Pinia store that all Druxt modules share. It does request deduplication, the resource and collection cache, and include handling. `useDruxtStore()` is auto-imported.

```ts
const store = useDruxtStore();
const resource = await store.getResource({
  type: 'node--article',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
});
```

A module that has resources from a request of its own seeds the store with `addResource({ resource, partial })` or `addCollection({ collection, type, hash, partial })`:

- With `partial: true`, such as for a view's rows, a resource holds only the fields it came with: its own attribute and relationship keys. So a later read of another field fetches it.
- A resource with no self link is stored by its type and id.
- An included resource, at any depth, holds every field. So a later read of it, sparse or not, comes from the store.
- The store does not keep Drupal's `links`, on a resource, its relationships or a collection. So the page payload does not name a backend URL.
- The store records partial or full when it adds a resource, so a hydrated page tells them apart too.

`clearCache()` empties the client's caches and every Druxt store:

- It also forgets which resources Drupal denied, so an include Drupal grants later is read again.
- The edit store's drafts are unsaved edits, so they stay.
- `clearCache({ drafts: true })` closes the drafts too. A sign-in and a sign-out call it that way, so one user's unsaved edits never reach the next.

Further reading:

- [The DruxtStore concept page](https://druxtjs.org/explanation/druxt-store): how it works and why it exists.
- [DruxtStore API](https://druxtjs.org/api/packages/core/runtime/store): its state and actions.
- [Deprecations](https://druxtjs.org/modules/druxt/deprecations): retired signatures.

## Editing

Editing belongs to core. Every editor of a Drupal entity shares one draft per entity and language, in the edit store. The editors are `DruxtEntityForm` and any inline editor, overlay tool or admin screen. The entity module's README has the design note: what core owns and what a module adds.

| Setting                 | Default     | Description                                                                                                                                    |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `editing.enabled`       | `true`      | Whether the site offers editing. `false` makes the permission `denied`.                                                                        |
| `editing.destination`   | `'jsonapi'` | The destination a draft saves to when it names none.                                                                                           |
| `editing.persistDrafts` | `true`      | Whether a saved entity's draft outlives its form. `false` closes it when the form unmounts. `DruxtEntityForm`, from `@druxt/entity`, reads it. |

### The draft model

`@druxt/core/edit` holds the drafts' model. It does not import a framework, so a later adapter for another framework keeps the same drafts. A draft is plain data:

| Key           | Holds                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `key`         | `draftKey({ type, id, langcode })`, or a new entity's `local` name in place of its id                              |
| `pristine`    | The entity as it was loaded or last saved, field values only                                                       |
| `edits`       | The changed attributes and relationships, by field, a relationship as `{ data }`                                   |
| `dirty`       | The changed fields' ids, in the order they changed                                                                 |
| `errors`      | The last save's or check's JSON:API errors, keyed by `source.pointer`, with `''` for one that doesn't name a field |
| `status`      | `idle`, `saving`, `saved`, `failed`, or `staged` when the destination took the change elsewhere                    |
| `pending`     | The write in flight, its destination and payload, or `null`                                                        |
| `fields`      | The fields a save may send, such as a form display's, or every field when unset                                    |
| `destination` | The destination its save goes to, `druxt.editing.destination` when unset                                           |

A draft never holds a token, a credential, Drupal's links or its meta. Pure functions build on it:

| Function                    | What it does                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `editDraft()`               | Sets a field. A value equal to the pristine one is clean again.                                                                  |
| `draftPayload()`            | Builds the write: the changed fields of a saved entity, or every field of a new one.                                             |
| `applySaved()`              | Takes the saved resource back as pristine. An edit made while the write ran stays.                                               |
| `draftField()`              | Gives a field's pristine and edited values, whether it changed, and its errors.                                                  |
| `findDraft(drafts, anchor)` | Finds the draft an element's anchors name, from `{ entity, type, langcode, field, delta }`.                                      |
| `anchorOf(element)`         | Reads those anchors from an element and the elements around it. So a click inside a rendered field names its draft and its item. |

### The edit store

`useDruxtEditStore()` is a Pinia store over that model, auto-imported. Drafts live in the browser's app, so they survive navigation. The store keeps them out of its serialized state, so none reaches the payload.

```ts
const edits = useDruxtEditStore();
const key = edits.open({ type: 'node--page', id, langcode: 'en' }, entity, { prefix: 'en' });
edits.edit(key, 'title', 'About us');
const { ok, errors } = await edits.save(key, { client: useDruxtClient() });
```

| Action                          | What it does                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `open()`                        | Opens a draft. It keeps the draft's edits, over a newer pristine copy, unless `reset` is `true`. |
| `edit()`, `update()`            | Change a draft.                                                                                  |
| `discard()`                     | Drops a draft's edits and errors.                                                                |
| `close()`                       | Forgets a draft.                                                                                 |
| `save()`                        | Sends one draft, through its destination.                                                        |
| `saveAll()`                     | Sends every changed draft, one after another, each through its destination.                      |
| `hold()`, `release()`           | An editor calls `hold()` while it shows a draft, and `release()` when it stops.                  |
| `fromAnchor()`, `fromElement()` | Find the draft an inline editor opens on.                                                        |
| `dirty`                         | Lists the changed drafts, for a save-all control or an unsaved-changes prompt.                   |

`saveAll()` never sends a new entity's draft that no editor holds.

### Destinations

A save goes to a destination. The default is `jsonapi`:

- It POSTs a new entity to Drupal's JSON:API, or PATCHes the changed fields of a saved one.
- It writes with the client it is given. So Drupal saves as that client's user, through the site's proxy when it has one.
- The resource Drupal answers becomes the draft's pristine copy and goes into the core store. So every module that reads the entity renders it.

An editing module can add a destination of its own, such as one that opens a change for review:

```ts
import { defineDruxtEditDestination } from '@druxt/core/edit';

useDruxtEditStore().addDestination(
  defineDruxtEditDestination({
    name: 'review',
    canSave: (draft) => draft.dirty.length > 0,
    async save(draft, { payload }) {
      await openChangeRequest(draft.key, payload);
    },
  }),
);
```

- A destination that answers no resource leaves the draft's edits in place, because Drupal does not hold them. The draft is then `staged`, and `saveAll()` skips it until it changes again. A draft edited while the destination took it is `idle`, so the next batch sends it again.
- A discard while a write runs clears the edits and leaves the draft `saving` until that write ends, so a new entity is never sent twice. The draft is then clean.
- `saveAll()` sends a new entity's draft only while an editor holds it. One that no editor holds when its turn comes is skipped, with `skipped: 'unheld'`.
- `canSave()` may answer with a promise.
- A draft names its destination when it is opened. Otherwise `druxt.editing.destination` names the default.
- A save to a destination no module added does not run, and development logs `DRUXT_E01003`.

### Hooks

The store fires three app hooks, whichever editor or destination acted:

| Hook                | When                                                                       | Receives                                                                               |
| ------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `druxt:edit:start`  | A draft's first change, or an editor's `start(key, field)`                 | `{ key, entity: { type, id, langcode }, fields }`                                      |
| `druxt:edit:save`   | A save ended, through whichever destination ran, or `canSave()` refused it | The same, with `destination`, `payload`, `ok`, `status`, `reason`, `data` and `errors` |
| `druxt:edit:cancel` | A draft's edits were discarded, as a form's reset does                     | The same as `druxt:edit:start`, its changed fields                                     |

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('druxt:edit:save', ({ entity, ok }) => {
    if (ok) console.log(`Saved ${entity.type} ${entity.id}`);
  });
});
```

`ok` says whether the save went through, and `save()` answers the same shape.

- A destination that took the change elsewhere and answered no resource is `ok`, with `status: 'staged'`, because Drupal does not hold the change yet. The form's status reads `Staged`.
- A save whose `canSave()` said no is not `ok`, with `reason: 'refused'`. Nothing was sent.

### Permission and controls

`useDruxtEditing()` says whether the current session can edit:

| Permission | When                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `denied`   | Editing is turned off, or no user is signed in through the browser's client.                                                                           |
| `allowed`  | The entity's links carry an `update` or `edit-form` relation. A module such as JSON:API Hypermedia adds one only for a user who may update the entity. |
| `unknown`  | There is no such signal. An editor offers the edit, tries the save and reports Drupal's answer.                                                        |

The core store does not keep links, so the links come from the editor that read them.

```vue
<script setup lang="ts">
const { permission } = useDruxtEditing();
</script>

<template>
  <button v-if="permission !== 'denied'" type="button">Edit</button>
</template>
```

`DruxtEditControls` is where an editing module renders its controls:

- `DruxtEntity` and `DruxtField` render it first when their `editing` prop is set. Its props are the entity's type, id and language, with the field's id.
- A wrapper places it with its `editControls` slot.
- Core's own renders its default slot, with the draft, the field's state in it, whether it changed and the permission. It renders nothing without a slot.
- A module registers its own `DruxtEditControls` with a higher priority to replace it on every entity and field.

## DruxtModule

A Druxt module turns a contract (wrapper candidates, data, props and slots) into themeable rendering, through `useDruxtModule(props, contract)`.

- The [custom module tutorial](https://druxtjs.org/tutorials/first-custom-module) covers building one.
- [Component resolution](https://druxtjs.org/explanation/component-resolution) covers the mechanism.
- [DruxtModule API](https://druxtjs.org/api/packages/core/runtime/useDruxtModule).

### Writing a module

A module's name is what its wrapper candidates are built from. In `defineComponent()`, set `name` and return the render function from `setup()`:

```ts
export default defineComponent({
  name: 'DruxtRecipes',
  props: { ...druxtModuleProps, limit: Number },
  emits: druxtModuleEmits,
  setup(props) {
    const recipes = ref([]);
    return useDruxtModule(props, {
      componentOptions: () => [['default']],
      async fetchData(ctx) {
        const query = { 'page[limit]': String(props.limit || 3) };
        recipes.value = (
          await ctx.client.getCollection('node--recipe', query, ctx.lang.value)
        ).data;
      },
      propsData: () => ({ recipes: recipes.value }),
      state: { recipes },
      watch: () => [props.limit],
    });
  },
});
```

In `<script setup>`, the name comes from the file name. So set `defineOptions({ name: 'DruxtRecipes' })` unless the file name is the full module name. Nuxt names `components/druxt/Recipes.vue` `DruxtRecipes`, but the file gives `Recipes`, and development warns about the difference. Render the render function as a component:

```vue
<script setup lang="ts">
const props = defineProps(druxtModuleProps);
defineEmits(druxtModuleEmits);
const Module = useDruxtModule(props, { componentOptions: () => [['default']] });
</script>

<template>
  <Module />
</template>
```

A `<script setup>` module passes only `class`, `style` and listeners through to its wrapper. A `defineComponent()` module passes its other attributes too, such as `id` and `data-*`.

### Wrappers

A wrapper is the component a module resolves and hands its data. It is an ordinary component, and `<script setup>` suits it.

- Druxt's bundled block wrappers have no root element of their own. Such a wrapper declares `druxtRootless: true`. The module then renders its element around the wrapper. It puts its classes and anchors, and a class the site sets, on that one element.
- A contract hook reads the wrapper the module resolved from `ctx.wrapper`.
- A module renders its default output in place, as `DruxtWrapper` rendered it, when the site gives it neither a wrapper nor attributes and it has no root attributes of its own. The markup is the same either way.

Druxt's components register in two ways. Both resolve by name:

- The components that render on nearly every page register globally and sync: `Druxt`, `DruxtWrapper`, `DruxtRouter`, `DruxtEntity` and `DruxtField`.
- The rest, such as `DruxtDebug`, `DruxtEntityForm` and `DruxtAuthLogin`, register globally and lazily, as a site's own `Druxt*` components do. So each loads with the page that uses it.

### The contract's hooks

- The hooks run outside the Nuxt context once they await, so a composable such as `useDruxtClient()` throws there. Use `ctx.client`, `ctx.store` and `ctx.lang`, or read anything else in `setup()` first.
- Every instance with the same inputs shares one request and one payload entry, and each renders all of it. A hook sets its data on the refs in `state`. An instance that did not fetch gets them restored, and then `restore()` is called.
- A module's `state` holds references into the stores, such as a menu's store key. It never holds values that depend on the page's route. Under shared prerender data another page reads the same entry, which a server's read again on a miss leaves as it was.
- A module with nothing to render says so through its contract's `empty()` hook, from its data, such as a menu with no links. While the hook answers `true`, the module renders no wrapper and no element, even for a class the site set on it. A default slot the site passes still renders, with the module's props, so the slot decides what an empty state shows.

### The page title

The page renders one `h1`. A component that renders the page's title calls `useDruxtPageTitle()` in `setup()`, and renders the `h1` only while `claim(owner)` answers `true`.

- The first claim on a page wins. So the page title block and the route's full-mode `DruxtEntity` never both render one.
- When the route names an entity, only that entity claims it.
- On a route with none, the first full `DruxtEntity` does, unless its `page-title` is `false`.
- A claimant claims for its own page's route. It lets the claim go when it unmounts or is deactivated, so a functional component cannot be one.

### A model from the parent

Core runs `fetchData` whether or not the parent gives a model through `v-model`. Skipping the fetch when the parent gives one is the module's choice. Keep what the module set itself, so its own model is not read back as the parent's:

```ts
let fetched: unknown;
const given = ref(0);
watch(
  () => props.modelValue,
  (value) => {
    if (value && toRaw(value) !== toRaw(fetched)) given.value++;
  },
);

return useDruxtModule(props, {
  async fetchData(ctx) {
    const value = ctx.model.value;
    if (value && toRaw(value) !== toRaw(fetched)) {
      item.value = value; // Given by the parent: no request.
      return;
    }
    item.value = fetched = await load(ctx);
    ctx.model.value = item.value;
  },
  restore(ctx) {
    const own = !ctx.model.value || toRaw(ctx.model.value) === toRaw(fetched);
    fetched = item.value;
    if (own) ctx.model.value = item.value;
  },
  state: { item },
  watch: () => [props.id, given.value],
});
```

During a server render, a parent bound to an empty ref sees the model only after its next render, which never comes on the server. Render the module's data through its wrapper or `ctx`, not the parent's own markup.

## Development tools

Add the tools as a dev dependency:

```sh
npm install --save-dev @druxt/devtools
```

With it installed:

- Druxt adds a Druxt tab to Nuxt DevTools. Its sections are Missing wrappers, Quiet errors, Modules, Requests and Settings.
- A module that rendered Druxt's default output is listed with the wrapper names it looked for. The tab offers to create one, on localhost only.
- Vue DevTools gets a Druxt inspector of the page's modules, and a Druxt requests timeline layer.
- The console prints a summary when the page settles.
- Nothing is added to the page, and a production build has none of it.

Without it, development prints one line saying so, and nothing else changes.

| Package              | Needed for                                                |
| -------------------- | --------------------------------------------------------- |
| `@druxt/devtools`    | The tools: the tab, the inspector and the console summary |
| `@nuxt/devtools-kit` | The Nuxt DevTools tab                                     |
| `@vue/devtools-api`  | Vue DevTools                                              |

All three are optional peer dependencies of `@druxt/core`. Nuxt and Vue Router install the last two, and development says which is missing when Nuxt DevTools is on. With pnpm's strict layout, core finds one only when the site lists it. So add each to the site's own dev dependencies, and do not rely on another package to bring it.

The Druxt tab is one of Nuxt DevTools' app tabs. When the window is too short for every tab, it moves to the overflow menu at the bottom of the sidebar. Pin it under Nuxt DevTools' Settings > Tabs to keep it at the top, or make the sidebar scrollable under Settings > Appearance.

Set `develMessages: 'inline'` for 1.x's inline messages in the page instead.

The tab is a `<druxt-devtools>` custom element, fed by a model with no Vue or Nuxt dependency. Both are in `@druxt/devtools`.

### Extending the tools from a module

A Druxt module adds its own section, timeline events and actions to the tools with `useDruxtDevtools()`. It calls it from a client plugin that it registers with `addDruxtDevtoolsPlugin()` from `@druxt/core/kit`.

The plugin is registered in development only, and every call does nothing without the tools. So a module never imports `@druxt/devtools` and never checks for it.

| Method                                    | What it adds                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `section({ id, label }, provider)`        | A tab in Nuxt DevTools, a node in Vue DevTools' Druxt inspector and lines in the console summary. |
| `event(label, detail)`                    | An event in the timeline, beside the requests.                                                    |
| `action({ id, label, section }, handler)` | A button whose handler runs in the app.                                                           |
| `note()`, `removeNote()`                  | A note on a module, added and cleared, as `addModuleNote()` and `removeModuleNote()` do.          |

A section's provider returns data, never markup: `pairs` (keys and values), `table` (columns and rows) and `tree` (any JSON value). It is read again on each page and as modules report, or on `refresh()`.

The router's Route section is built this way:

```ts
// In the module's setup.
addDruxtDevtoolsPlugin(nuxt, await resolvePath(resolve('./runtime/plugins/devtools')));
```

```ts
// runtime/plugins/devtools.ts
export default defineNuxtPlugin(() => {
  const route = useRoute();
  const store = useDruxtRouterStore();
  const section = useDruxtDevtools().section({ id: 'route', label: 'Route' }, () => [
    {
      type: 'pairs',
      items: {
        path: route.path,
        'entity type': store.route.props?.type ?? '',
        'entity uuid': store.route.entity?.uuid ?? '',
        // The URL's language prefix: empty for the unprefixed default language.
        'language prefix': route.meta.langcode ?? '',
      },
    },
  ]);
  watch(
    () => [route.path, route.meta.langcode, store.route],
    () => section.refresh(),
    { deep: true },
  );
});
```

## Error codes

A development error Druxt reports names its code, `DRUXT_E` and five digits, so it can be found here. Each package has a code space of its own, its first two digits:

| Package             | Codes |
| ------------------- | ----- |
| `@druxt/core`       | 01xxx |
| `@druxt/schema`     | 02xxx |
| `@druxt/router`     | 03xxx |
| `@druxt/entity`     | 04xxx |
| `@druxt/views`      | 05xxx |
| Druxt auth          | 06xxx |
| `@druxt/devtools`   | 07xxx |
| `@druxt/blocks`     | 08xxx |
| `@druxt/menu`       | 09xxx |
| `@druxt/breadcrumb` | 10xxx |

| Code           | Meaning and what to do                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DRUXT_E01001` | Drupal omitted resources of a type from a response, quoting its reason, such as missing permissions, so what renders from it is incomplete. Read it as a user who may see them, such as through the server client with the build credentials. In development, the Druxt DevTools tab marks the request as partial.                                                                                                                                                                      |
| `DRUXT_E01002` | `druxt.proxy.files` is on, but the build is static, as `nuxt generate` makes it, with no server to proxy Drupal's files. File URLs are absolute on `druxt.filesUrl`, or on `druxt.baseUrl`, so the browser reads files from there. Set `filesUrl` to serve them from elsewhere, or deploy a server.                                                                                                                                                                                     |
| `DRUXT_E01003` | A draft saved to a destination no module added, so it didn't save. Add the destination with `useDruxtEditStore().addDestination()`, or set `druxt.editing.destination`, or the draft's own, to one that exists.                                                                                                                                                                                                                                                                         |
| `DRUXT_E01004` | Browser sign-in is on, with `druxt.auth`, and `druxt.auth.scope` is empty. On Simple OAuth 6 a token holds only the roles its scopes name, so a signed-in editor reads less than an anonymous visitor. Set `druxt.auth.scope` to the scopes of the roles your editors need. In development, the Druxt DevTools tab names a read the scope refused.                                                                                                                                      |
| `DRUXT_E01005` | A file a prerendered page names, in Drupal's public files, was not copied into the static build, as Drupal did not answer it, so the page links to a missing file on the site. The message names the file and Drupal's answer. Check that the file exists on Drupal and that the build can read it, or set `druxt.filesUrl` to where the files are served from.                                                                                                                         |
| `DRUXT_E01006` | The build stopped, as `druxt.endpoint`, with or without a language prefix, is at or under `/api/_druxt`, where Druxt's own server routes are, or `druxt.proxy.files` overlaps it. Set `druxt.endpoint` to the path Drupal serves JSON:API at, such as `/jsonapi` or `/api`, outside `/api/_druxt`.                                                                                                                                                                                      |
| `DRUXT_E01007` | The token route refused a sign-in, or ended a session on a refresh, as Drupal's access or refresh token would make its cookie larger than the 4096 bytes a browser keeps of one cookie, which the browser would drop. It answers 502, and the browser is signed out. The server's log names the token and its size, never its value. Give the Simple OAuth token fewer scopes or shorter-lived claims, or sign it with a smaller key, in Drupal.                                        |
| `DRUXT_E01008` | Drupal refused a production build's read of the site's languages, so the build stopped: the site would have routed and proxied no language prefix. Check the build's credentials and what their role may read. A Drupal that doesn't answer is a warning, as is any failure in development.                                                                                                                                                                                             |
| `DRUXT_E02001` | `druxt.schema.filter` excluded a display Drupal has, so the entity renders nothing in that mode, rather than the `default` display. Add the display's id, or a pattern matching it, to `druxt.schema.filter`.                                                                                                                                                                                                                                                                           |
| `DRUXT_E02002` | The build could not read a bundle's base field overrides. Drupal lists `base_field_override` and omits them for the build's reader, so a base field keeps Drupal's default label, Title where the bundle says Recipe Name. Give the build's credentials the `administer <entity type> fields` permission, or the Druxt Drupal module's `access druxt resources` once it grants the overrides.                                                                                           |
| `DRUXT_E04001` | A `DruxtEntityForm`'s `v-model` is an entity of another type than its `type` prop, so the form didn't save, as it saves to its type's endpoint. Give the form the model's type, or a model of the form's type.                                                                                                                                                                                                                                                                          |
| `DRUXT_E04002` | `DruxtRouterEntity` rendered a route whose `props` don't name an entity type and uuid, so it rendered nothing. A route Decoupled Router resolves to an entity always has them, so check a wrapper that hands it another route.                                                                                                                                                                                                                                                          |
| `DRUXT_E04003` | A `DruxtEntity` wrapper read an attribute or relationship the request didn't fetch, as `query.schema` limits a view to the display's fields and the fields the build found in the site's wrappers. Name the field in the wrapper's source, add it to `query.fields`, or set `query.schema: false`. The Druxt DevTools tab notes the read too.                                                                                                                                           |
| `DRUXT_E04004` | Drupal refused an entity's request. A 400 with includes is read again without them. Any other 4xx, or a failed retry, is logged with its status and the request's shape, and the entity renders nothing. The shape keeps the parameter names and drops the id and the values. It's logged once per shape, on the server in production too. Check each include names a relationship the bundle serves, such as a wrapper's `druxt.query.include`, and the reader's access to the entity. |
| `DRUXT_E04005` | A `DruxtEntityForm` field uses a widget Druxt renders as the JSON textarea until a later release, such as `file_generic`, or Layout Builder's widget, which renders nothing. The Druxt DevTools tab notes the field. A `DruxtField` wrapper component for the widget renders your own control.                                                                                                                                                                                          |
| `DRUXT_E04006` | A form display lists a component with no widget and no field, such as a module's extra field, so `DruxtEntityForm` skipped it. The Druxt DevTools tab notes it. A `DruxtEntityForm` wrapper component can render it.                                                                                                                                                                                                                                                                    |
| `DRUXT_E04007` | Neither the form's credentials nor the build could read the workflow that moderates a bundle, so its moderation state widget is a text input. The build logs it once per bundle, and development once per field, with a Druxt DevTools note. Give the role of the build's credentials, `DRUXT_BUILD_AUTH_CLIENT_ID` and `DRUXT_BUILD_AUTH_CLIENT_SECRET` or `druxt.build.auth`, the "administer workflows" permission, and rebuild.                                                     |
| `DRUXT_E04008` | A `DruxtEntity` or `DruxtField` has its `editing` prop set. It renders `DruxtEditControls` first, for an editing module's controls, and its output is otherwise the same. The form display in place, and a field's widget that saves the field alone, come in 2.1.0. The Druxt DevTools tab notes it. Edit the entity with `DruxtEntityForm`, which shares its draft with every editor.                                                                                                 |
| `DRUXT_E04009` | A reference widget's read of its candidates failed for another reason than a refusal, such as a 500 or a Drupal that didn't answer, so the widget offers none and keeps the values it holds. It reads again the next time it lists or searches. The Druxt DevTools tab notes the field. Check that Drupal is reachable, and its log for the request.                                                                                                                                    |
| `DRUXT_E08001` | Drupal refused to list a theme's block placements, at build or on the server, by answering 401 or 403 or by omitting every placement. The build stops, and the placements route answers 502 with this code. Grant the role the build signs in with `access druxt resources`, from the Druxt Drupal module, or `administer blocks`, and set the build credentials in `druxt.build.auth` or the `DRUXT_BUILD_*` variables.                                                                |
| `DRUXT_E08002` | A `DruxtBlock` has none of `id`, `uuid` and `block`, so it has no placement to render. It renders this error in development, and nothing in production. Give it one of the three.                                                                                                                                                                                                                                                                                                       |
| `DRUXT_E08003` | A block placement has a visibility condition the frontend cannot check, such as `user_role`, `current_theme` or a contributed one, so the block is hidden. The development tools note it on its region. Set `druxt.blocks.visibility.unknown` to `show` to render such blocks anyway.                                                                                                                                                                                                   |
| `DRUXT_E08004` | A bundled block wrapper hands off to a module the site does not install, such as a menu block to `DruxtMenu` without `@druxt/menu`. Block content needs `@druxt/entity`, and a Views block needs `@druxt/views`. The block renders nothing, and the development tools note it on the block. Add the module, or a wrapper of your own for the plugin.                                                                                                                                    |
| `DRUXT_E08005` | A Views block has its own page size, `items_per_page`, which is not sent yet, as Drupal answers a size outside the display's exposed options with no rows. The view shows its own page size. Set the size on the display in Drupal.                                                                                                                                                                                                                                                     |
| `DRUXT_E09001` | Drupal answered 403 or 404 for linkset, JSON:API Menu Items and menu link content, so no menu source is readable and menus render empty. Turn on `system.feature_flags:linkset_endpoint` (Drupal 10.1 and later), install JSON:API Menu Items, or let visitors view menu link content. Restart the server, or clear Druxt's cache, to detect the source again.                                                                                                                          |
| `DRUXT_E09002` | A menu source failed to answer the detection other than by refusing, such as a 5xx, a timeout or no response. The warning names the source and the status. That menu renders empty, nothing is held, and the next read detects again. Check the backend's logs for the failing endpoint.                                                                                                                                                                                                |
| `DRUXT_E10001` | The decoupled router failed to answer for the page a `DruxtBreadcrumb` builds its trail for, such as with a 5xx or no response. The breadcrumb renders this error in development, and nothing in production. A path Drupal answers 404 for is not this error: its trail is the home crumb and any pages above it. Check the backend's logs for `/router/translate-path`.                                                                                                                |
| `DRUXT_E11001` | `DruxtSite` has no theme, so it renders the page alone. Set `druxt.site.theme`, give the `theme` prop, or let the build read the block placements.                                                                                                                                                                                                                                                                                                                                      |
| `DRUXT_E11002` | The site's build has no default theme for `DruxtSite`, as the block placements could not be read or Drupal doesn't place any. Set `druxt.site.theme`.                                                                                                                                                                                                                                                                                                                                   |
| `DRUXT_E11003` | The decoupled settings did not reach the site's build. Drupal publishes none, refused the build's reader or did not answer. The branding comes from `druxt.site` and the theme and regions from the placements. The `decoupled_settings` Drupal module publishes them, and the build's role needs `read decoupled settings`.                                                                                                                                                            |
| `DRUXT_E11004` | No region `DruxtSite` renders holds the theme's main block, so the page renders after the regions. Place the main block in a rendered region, or render that region with `druxt.site.regions`.                                                                                                                                                                                                                                                                                          |
| `DRUXT_E10002` | A `DruxtBreadcrumb` has a `menu` prop, but `@druxt/menu`, which reads the menu, is not installed. The breadcrumb renders this error in development, and nothing in production. Add `@druxt/menu` to your modules, or leave out `menu` to build the trail from the router.                                                                                                                                                                                                               |

## Where to go next

- New to Druxt? Start with the [Getting started tutorial](https://druxtjs.org/tutorials/getting-started).
- Ready for the full site experience? See the [Site module](https://druxtjs.org/modules/site).

---

## Modules

- [@druxt/blocks](https://druxtjs.org/modules/blocks) - Decoupled Blocks and Regions
- [@druxt/breadcrumb](https://druxtjs.org/modules/breadcrumb) - Router based Breadcrumbs
- [@druxt/entity](https://druxtjs.org/modules/entity) - Decoupled Content entities, forms and fields
- [@druxt/menu](https://druxtjs.org/modules/menu) - Decoupled Menus
- [@druxt/router](https://druxtjs.org/modules/router) - Decoupled Router
- [@druxt/schema](https://druxtjs.org/modules/schema) - Drupal Display mode schemas
- [@druxt/site](https://druxtjs.org/modules/site) - A decoupled Drupal site from one module
- [@druxt/views](https://druxtjs.org/modules/views) - Decoupled Views

---

## Links

- Documentation: https://druxtjs.org
- Community Discord server: https://discord.druxtjs.org
- Demo - Umami Food Magazine:
  - https://demo.druxtjs.org
  - https://storybook.umami.demo.druxtjs.org

---

## Support

Druxt is an open-source project, built by the community for the community.

Find support or get involved in building Druxt via the community channels:

- [DruxtJS Discord server](https://discord.druxtjs.org)
- **#druxt** Slack channel on [Drupal.org slack](https://drupal.org/slack)

---

## Contributing

[![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/druxt/druxt.js)

See the [Contributing guide](https://github.com/druxt/druxt.js/blob/HEAD/CONTRIBUTING.md).

Before a change to a runtime option is done:

- Prove a runtime option by changing it after the build, not only by its presence in config.

---

## License

[MIT](https://github.com/druxt/druxt.js/blob/HEAD/LICENSE)
