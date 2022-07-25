---
title: Proxy
weight: -4
---

### Druxt and Proxies

> Druxt provides API and File proxying using the @nuxtjs/proxy module.

* * *

## API proxy

As Druxt requires both a frontend and a backend server and communication occurs
both from the frontend and the users browser, it's not uncommon to encounter
Cross-origin resource sharing (CORS) issues.

The API Proxy allows routing browser communication through the frontend to
prevent CORS issues.

```js
export default {
  druxt: {
    proxy: { api: true }
  }
}
```

Two proxy items will be created, one for the JSON:API endpoint, and the other
for the decoupled router.

* * *

## Files proxy

Druxt provides Drupal file proxying, to map your **/sites/default/files**
directory to your frontend domain.

```js
export default {
  druxt: {
    proxy: { files: true }
  }
}
```

If you are using a multi-site path, use the path as the value instead of `true`:

```js
export default {
  druxt: {
    proxy: { files: 'druxtjs.org' }
  }
}
```

* * *

## Aditional proxy settings

Druxt uses the Nuxt Proxy module, additonal proxies can be set in
**nuxt.config.js** and will be merged with the API and file proxy values.

```js
export default {
  druxt: {
    proxy: {
      api: true,
      files: true,
    }
  },
  proxy: {
    '/en/jsonapi': 'https://demo-api.druxtjs.org'
  }
}
```

For more details, see the [Nuxt Proxy module](https://github.com/nuxt-community/proxy-module).
