---
title: Deploy a server-rendered site
weight: 4
description: 'Run the built app as a node service behind a web server, on your own host or a container platform like Lagoon.'
---

> **Before you start:** read [Deployment
> models](/explanation/deployment-models) to confirm you need a server.
> Static hosting is cheaper and simpler when it fits.

A server-rendered Druxt site is a node process:

```sh
nuxt build
nuxt start
```

`nuxt start` reads `HOST` and `PORT` (see [Environment
variables](/how-to/environment-variables)) and serves live-rendered
pages. Run it under a supervisor (systemd, PM2, or a container
platform's own runtime) so it restarts on failure, and put a web server
or the platform's ingress in front for TLS.

The [API proxy](/how-to/proxy) works in this model, so browsers can talk
only to the frontend origin, and server middleware can hold secrets
(mail delivery, search services) via `privateRuntimeConfig`.

## Behind nginx

A minimal reverse proxy:

```nginx
server {
  listen 443 ssl http2;
  server_name www.example.com;

  ssl_certificate /etc/ssl/certs/www.example.com.pem;
  ssl_certificate_key /etc/ssl/private/www.example.com.key;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Add caching for anonymous traffic once things work. One caution from
production: anything that sets cookies on every response (some auth
setups do) makes responses uncacheable; keep anonymous responses
cookie-free so a CDN or cache in front can do its job.

## The hybrid: static files with a server fallback

Production Druxt sites often combine the models: nginx serves the
`nuxt generate` output directly with long cache headers, and passes
anything not generated (authenticated pages, server routes) to the node
service:

```nginx
location / {
  root /app/dist;
  try_files $uri $uri/index.html @node;
}

location @node {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Most traffic gets CDN-grade static delivery; the node service only works
for the routes that need it. Driving the build target with an
environment variable (`NUXT_TARGET`) lets one codebase produce both
builds.

## On a container platform

On [Lagoon](https://lagoon.sh) (which hosts this site) the same shapes
map to services: a `node` service running `nuxt start`, or the hybrid as
an `nginx` service whose image contains the generated files plus a
`node` fallback service. The build runs in the image build, which means:

- Environment variables the build needs must reach the **image build**
  (declared as build arguments), not just the running container. This
  is true of any Docker-based platform.
- The backend must be reachable from the builder. Gate the build on the
  backend answering (`curl` its `/jsonapi` until 200), and retry the
  build once or twice, because large generates can fail transiently.

## Content freshness

Server-rendered pages are live. Generated pages in the hybrid are not:
rebuild on a schedule, or from a Drupal webhook, whichever matches how
often editors publish. The rebuild options in [Deploy a static
site](/how-to/deploy-static#after-the-first-deploy) apply to the
hybrid's static half unchanged.

## Where to go next

- [Environment variables](/how-to/environment-variables): the build-time
  vs runtime distinction matters most in this model.
- [Proxy the Drupal backend](/how-to/proxy): single-origin browser
  traffic.
- [Authenticate users with OAuth](/how-to/authentication): server
  deployments unlock the full authenticated experience.
