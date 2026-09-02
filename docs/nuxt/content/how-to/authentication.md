---
title: Authenticate users with OAuth
weight: 0
description: 'The full OAuth setup from scratch: Simple OAuth keys, scopes and a consumer in Drupal, druxt-auth in Nuxt, and the traps on both sides.'
---

> **Before you start:** the [login flow
> tutorial](/tutorials/authentication) uses the quickstart's ready-made
> OAuth setup. This guide builds that setup from scratch on your own
> backend, and covers the failure modes people actually hit.

Druxt authenticates with OAuth 2 Authorization Code + PKCE:
[Simple OAuth](https://www.drupal.org/project/simple_oauth) on the Drupal
side, [druxt-auth](https://github.com/druxt/druxt-auth) (built on
`@nuxtjs/auth-next`) on the Nuxt side.

## Drupal: install and generate keys

```sh
composer require drupal/simple_oauth:^6
drush pm:enable simple_oauth
drush simple-oauth:generate-keys ../keys
```

Keys belong **outside the web root** (`../keys` relative to it), and
never in git; production sites commit only a deny-rule placeholder in
that directory and deploy real keys out of band. If key generation fails
on Windows, generate under WSL2; native OpenSSL setups there have
repeatedly produced broken keys that surface later as opaque frontend
errors.

Short access tokens with longer refresh tokens are the production norm
(minutes and hours respectively); set both in the Simple OAuth settings.

## Drupal: create a scope

Simple OAuth 6 refuses any authorization request it cannot resolve a
scope for, and **a fresh site ships no scopes**, so every login fails
with "Check the `scope` parameter" until one exists. Create one (Drupal
→ Administration → Configuration → People → Simple OAuth → Scopes, or
programmatically): grant types `authorization_code` and `refresh_token`,
granularity **role**, mapped to the role your users hold (for example
`authenticated`).

## Drupal: create the consumer

Create a Consumer (Drupal → Configuration → Web services → Consumers):

| Field | Value |
| ----- | ----- |
| Client ID | A stable id your frontend will use; generate a UUID |
| Secret | Empty. A browser app cannot keep a secret; PKCE replaces it |
| Confidential | Off |
| PKCE | On |
| Scopes | The scope you created, as the default |
| Redirect URI | `https://your-frontend/callback`, one per environment |

Every frontend origin that logs in (production, previews, `localhost`)
needs its redirect URI registered; production setups keep one consumer
per environment.

## Nuxt: configure druxt-auth

```js
export default {
  buildModules: [
    ['druxt-auth', {
      auth: {
        clientId: process.env.OAUTH_CLIENT_ID,
        scope: ['druxt'],
      },
    }],
  ],
}
```

The module registers two strategies: `drupal-authorization_code` (the
PKCE flow above, the right default) and `drupal-password` (server-side
password grant). Trigger a login from any component:

```js
this.$auth.loginWith('drupal-authorization_code')
```

The `/callback` route is handled for you.

## The login page trap

A "Log in" menu link pointing at `/user/login` fails: Decoupled Router
has no resolver for Drupal's user routes, so the frontend request for
that path errors. Either create your own page at `pages/user/login.vue`
that calls `loginWith`, or point the menu link somewhere the frontend
owns. There is no default login page; every site provides its own.

## Which requests carry the token

Logging in gives the app a Bearer token, and `@nuxtjs/auth-next` attaches
it to its own requests (the userinfo endpoint, proxied through the
frontend by druxt-auth). Druxt's JSON:API traffic goes through the
[DruxtClient](/how-to/use-the-druxt-client)'s own axios instance, so to
fetch access-controlled content as the logged-in user, attach the token
there with a plugin:

```js
// plugins/druxt-auth-token.js
export default ({ $auth, $druxt }) => {
  $druxt.axios.interceptors.request.use((config) => {
    if ($auth.loggedIn) {
      config.headers.Authorization = $auth.strategy.token.get()
    }
    return config
  })
}
```

Drupal then applies the user's real permissions to every response,
including menus and routes.

## Writes, and the CSRF question

Form submissions through `DruxtEntityForm` are JSON:API writes.
[Enable writes](/how-to/prepare-the-backend#check-the-jsonapi-settings)
(`read_only: 0`) first. With **Bearer token** authentication, no CSRF
token is needed; Drupal's CSRF protection applies to **cookie**
sessions. A 403 naming `X-CSRF-Token` means the request authenticated by
cookie (typically a session shared with the Drupal domain) rather than
by the OAuth header: attach the Bearer token as above, or fetch a CSRF
token from Drupal's `/session/token` and send it in the `X-CSRF-Token`
header alongside cookie auth.

## Logging out

`this.$auth.logout()` ends the frontend session. Data fetched while
logged in stays in the [DruxtStore](/explanation/druxt-store) until the
page reloads; a logout flow that must drop privileged content
immediately should force a reload or flush the affected resources.

## Where to go next

- [Add a login flow](/tutorials/authentication): the tutorial version on
  the quickstart.
- [Request topology](/explanation/request-topology#cookies-and-sessions):
  how hosting layout affects cookies and credentialed CORS.
- [druxt-auth README](https://github.com/druxt/druxt-auth): every module
  option.
