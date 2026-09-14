# examples/drupal — the Umami dev backend

A minimal Drupal 11 backend for developing the druxt.js packages against:
the `demo_umami` profile, the Druxt module stack, Spanish at `/es`, and the
public PKCE OAuth consumer the frontend examples hardcode. No committed
config or content — every provision is a fresh `site-install` with Umami's
own demo content.

The full production-shaped backend for druxtjs.org (Tome content sync,
translations, jsonapi_hypermedia) lives in the
[druxtjs.org site backend](https://github.com/druxt/druxtjs.org). This one
exists to be cheap to boot and throw away.

## DDEV (recommended locally)

DDEV provides the services; the same provision script installs the site
(inside the container, still SQLite — the point is a throwaway database):

```bash
cd examples/drupal
ddev start
ddev composer install
ddev exec .devtools/provision
# Site at http://druxt-examples-backend.ddev.site
```

## .devtools (Docker-free: SQLite + PHP built-in server)

Same interface as the docs backend, minus Tome:

```bash
cd examples/drupal
make build      # assemble + provision + start
# or step by step:
make assemble   # composer install
make provision  # site-install demo_umami (SQLite) + druxt + /es + consumer
make start      # PHP built-in server on 127.0.0.1:8888 (override: WEBSERVER_PORT)
make login      # one-time login link
make reset      # stop + wipe the throwaway database
```

## Credentials and ports

| Thing | Value |
| ----- | ----- |
| Admin login | `admin` / `druxt123` (set by provision) |
| OAuth client id | `c6e3275c-05cb-45f0-a3c3-c037bf730963` (public PKCE) |
| OAuth redirect | `http://localhost:3004/callback` (Content Ops Console port) |
| Default URL | `http://127.0.0.1:8888` |

## Multilingual caveat

`/es` routing works (decoupled_router path-prefix resolution is exercised
by the examples), but Umami's demo content is English-only — there is no
translated recipe content here. The multilingual e2e specs that assert
translated content run against the full site backend, not this one.
