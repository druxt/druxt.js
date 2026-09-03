---
title: Add a login flow
weight: -7
description: Turn the quickstart's already-configured OAuth setup into a real, working login.
---

If you completed [Getting started](/tutorials/getting-started), you already
have a working authentication setup: you just haven't used it yet. This
tutorial logs a real user in through it, so you can see the whole flow work
before building on it.

## Prerequisites

- The [Getting started](/tutorials/getting-started) tutorial, completed and
  still running (`npm run dev` in your project root).

## Step 1: See what's already there

Open `nuxt/nuxt.config.js` in your project and look at `modules`:

```js
modules: [
  ['druxt-auth', { clientId: process.env.OAUTH_CLIENT_ID }],
  'druxt-site',
],
```

The [`druxt-auth`](https://github.com/druxt/druxt-auth) module is already
installed and configured: `npm run setup` (back in Getting started)
provisioned a Drupal OAuth Consumer (Drupal's entity for one registered
OAuth client) for you and wrote its ID to
`OAUTH_CLIENT_ID` in `.env`. There's also already a page at
`nuxt/pages/user/login.vue` that starts the login flow:

```js
export default {
  created() {
    this.$auth.loginWith('drupal-authorization_code');
  },
};
```

**Outcome:** you've confirmed there's nothing left to install: the frontend
is already wired for login, it just doesn't have a visible way to trigger it
yet. This tutorial adds that visible trigger.

## Step 2: Make sure you have an active Drupal session

The OAuth flow needs you to already be logged into Drupal, so it has someone
to ask "grant access to this app?". Run:

```sh
npm run login
```

**Outcome:** your browser opens a Drupal admin session, same as in Getting
started. Leave that tab open (or just remember you're logged in) and go back
to the frontend.

## Step 3: Trigger the login

With the frontend running, open http://localhost:3000/user/login.

**Outcome:** the page briefly shows "Redirecting..." then sends you to
Drupal's OAuth authorization screen, asking you to approve access for the
"Druxt" consumer. Approve it. You're redirected back to
http://localhost:3000/callback, then on to the frontend homepage, now
authenticated.

## Step 4: Confirm you're actually logged in

Nothing on the page visibly changes yet. There's no login state shown in
the UI. Open your browser's DevTools, go to **Application → Local Storage**
(Chrome) or **Storage → Local Storage** (Firefox) for `localhost:3000`, and
look for keys starting with `auth.`.

**Outcome:** you'll see `auth.strategy` set to `drupal-authorization_code`
and an `auth._token.drupal-authorization_code` entry holding your access
token. That's Nuxt's auth module confirming you're logged in.

## What you've got

A real, working OAuth 2.0 Authorization Code (with PKCE) login flow, backed
by Drupal's Simple OAuth module. No passwords touch the frontend at any
point.

| Piece                                            | What it is                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Drupal Consumer (provisioned by `npm run setup`) | A public OAuth client with PKCE enabled, redirecting to `/callback` |
| `druxt-auth` module                              | Wires `@nuxtjs/auth-next` up with Drupal-specific OAuth strategies  |
| `pages/user/login.vue`                           | Starts the flow                                                     |
| `/callback` route                                | Added automatically by `druxt-auth`; completes the token exchange   |

From any component, `this.$auth.loggedIn` and `this.$auth.user` are now
usable: `user` is populated from Drupal's `/oauth/userinfo` endpoint. A
natural next step is adding a login/logout link to your layout using those,
rather than requiring people to know the `/user/login` URL by heart.

## Known limitations

Current as of `druxt-auth` 0.4.0:

- **No automatic token refresh for this flow.** The Authorization Code
  strategy here doesn't have refresh-token handling configured, so your
  session ends when the access token expires rather than renewing silently.
  Password grant (a different setup; see the
  [`druxt-auth` README](https://github.com/druxt/druxt-auth)) does have
  refresh handling, but needs a _confidential_ Consumer with a secret, unlike
  the public one this tutorial's Consumer already is.
- **Logging out** isn't wired to any UI yet either: `this.$auth.logout()`
  ends the session once you've added something to call it.

## Where to go next

- Keep learning: [Deploy your site](/tutorials/deploy-your-site), the
  final lesson.
- See this flow put to work in a real app: [Explore the example
  apps](/how-to/example-apps): Content Ops Console uses this exact login to
  authenticate its inline content editing.
- Full authentication option reference (scopes, environment variables):
  the [`druxt-auth` README](https://github.com/druxt/druxt-auth).
- Understand the machine you just started: [Architecture](/explanation/architecture).
