import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#app'
import type { DruxtPublicAuthOptions } from '@druxt/client'

/**
 * Where a signed-out visitor goes when the site has no login page of Druxt's, with `auth.login: false`.
 *
 * It is auth-next's own default, which druxt-auth 0.x left in place. A site's own page there signs them in.
 */
const SITE_LOGIN = '/login'

// The `druxt-auth` route middleware, used as `definePageMeta({ middleware: 'druxt-auth' })`.
//
// It lets signed-in visitors through only, as auth-next's `auth` middleware did. A signed-out visitor never reaches
// the page. They go to the login route, with the page they asked for in the `redirect` query.
export default defineNuxtRouteMiddleware((to) => {
  const druxt = useNuxtApp().$druxt
  if (druxt.auth?.loggedIn) return
  // The client's auth options carry the public config's login route.
  const login = (druxt.options.auth as Partial<DruxtPublicAuthOptions> | undefined)?.login
  return navigateTo({ path: login || SITE_LOGIN, query: { redirect: to.fullPath } })
})
