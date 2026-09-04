---
title: Proxy the Drupal backend through Nuxt
weight: -6
description: Route API and file requests through the frontend origin, so browser traffic never crosses the CORS boundary.
---

> **Before you start:** this guide assumes a working Druxt site (see
> [Getting started](/tutorials/getting-started)). To understand when the
> proxy applies and when you need [CORS](/how-to/configure-cors) instead,
> see [Request topology](/explanation/request-topology).

Druxt proxies API and file requests with the
[@nuxtjs/proxy](https://github.com/nuxt-community/proxy-module) module:
the browser talks only to the frontend origin, and the Nuxt server
forwards to Drupal. Cross-origin requests stop existing, so CORS stops
mattering.

The proxy runs as server middleware inside `nuxt dev` and `nuxt start`.
**A generated static site has no server, so the proxy does not exist
there.** If you deploy with `nuxt generate` and the browser must
reach Drupal, [configure CORS in Drupal](/how-to/configure-cors)
instead, and see the target-tied setting in
[Deploy a static site](/how-to/deploy-static).

## API proxy

Routes browser JSON:API traffic through the frontend:

```js
export default {
  druxt: {
    proxy: { api: true },
  },
};
```

This creates two proxy routes: one for the JSON:API endpoint, and one
for the decoupled router. With it enabled, `DruxtClient` switches the
browser to relative URLs automatically; there is nothing else to
configure on the frontend.

## Files proxy

Maps Drupal's `/sites/default/files` onto the frontend domain, so image
and file URLs in content resolve without pointing at the backend:

```js
export default {
  druxt: {
    proxy: { files: true },
  },
};
```

On a Drupal multi-site, pass the site directory name instead of `true`:

```js
export default {
  druxt: {
    proxy: { files: 'cms.example.com' },
  },
};
```

That maps `/sites/cms.example.com/files` rather than
`/sites/default/files`.

## Additional proxy routes

The Druxt entries merge with anything you add to Nuxt's own `proxy`
config, so backend paths beyond the API can ride the same origin. A
server-side endpoint the frontend calls (a logout route, a sitemap)
is one line:

```js
export default {
  druxt: {
    proxy: { api: true },
  },
  proxy: {
    '/oauth/logout': process.env.BASE_URL,
    '/sitemap.xml': process.env.BASE_URL,
  },
};
```

For matching options and rewrites, see the
[Nuxt Proxy module](https://github.com/nuxt-community/proxy-module).

## Where to go next

- [Request topology](/explanation/request-topology): why only browser
  requests ever needed this.
- [Configure CORS in Drupal](/how-to/configure-cors): the alternative,
  and the only option for static deployments.
- [Authenticate users with OAuth](/how-to/authentication): the logout
  route above in context.
