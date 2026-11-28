---
'druxt': minor
'druxt-menu': patch
'druxt-router': patch
---

feat(#1054): each language now reaches Drupal under the URL prefix Drupal serves it at, which needn't be its langcode.

Drupal's default setup gives the default language no prefix, and Druxt asked for `/en/jsonapi`, which Drupal answers with a 404. It now asks for `/jsonapi`. A language whose prefix isn't its langcode, such as `es` served at `/spanish`, works too.

At build, Druxt reads each language's prefix from Drupal. A prefix that is neither the langcode nor the default language's can only be read when the Decoupled Settings module publishes `language.negotiation`. Otherwise, or to skip the read, set the prefixes in `nuxt.config.js`:

```js
export default {
  druxt: {
    prefixes: { en: '', es: 'spanish' },
  },
};
```

A request without a langcode asks for the default language under its prefix, such as `/en/jsonapi` when English has the prefix `en`, so it gets the default language whatever else Drupal would negotiate. Druxt reads the default language at build, or takes it from a language with an empty prefix in `prefixes`. Set `defaultLangcode` to skip the read.

The API proxy, the router's language routes and its home-page redirect follow the same prefixes. The router adds its routes once every module is registered, so a module such as `@nuxtjs/i18n` can't rewrite them, whichever order the modules are listed in. A language whose prefix can't be read is taken to be served under its langcode, with a build warning, as before.
