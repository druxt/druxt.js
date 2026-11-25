import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { useNuxtApp } from '#imports'
import type { DruxtPublicAuthOptions } from '@druxt/client'
import middleware from '../../packages/core/src/runtime/middleware/auth'

const to = { path: '/account', fullPath: '/account?tab=edits' } as RouteLocationNormalized

/** The middleware's answer for a navigation, as Nuxt runs it: inside a middleware, where `navigateTo()` returns the location. */
const guard = async () => {
  const nuxtApp = useNuxtApp()
  nuxtApp._processingMiddleware = 'druxt-auth'
  try {
    return await nuxtApp.runWithContext(() => middleware(to, to))
  } finally {
    nuxtApp._processingMiddleware = false
  }
}

describe('the druxt-auth route middleware', () => {
  let login: DruxtPublicAuthOptions['login'] | undefined

  beforeEach(() => {
    useNuxtApp().$druxt.auth?.clearTokens()
    login = (useNuxtApp().$druxt.options.auth as DruxtPublicAuthOptions).login
  })

  afterEach(() => {
    (useNuxtApp().$druxt.options.auth as DruxtPublicAuthOptions).login = login!
    useNuxtApp().$druxt.auth?.clearTokens()
  })

  it('sends a signed-out visitor to the login page, with the page they asked for', async () => {
    expect(await guard()).toEqual({ path: '/user/login', query: { redirect: '/account?tab=edits' } })
  })

  it('lets a signed-in visitor through', async () => {
    useNuxtApp().$druxt.auth!.setTokens({ access_token: 'abc', refresh_token: 'def', expires_in: 300 }, 'druxt')
    expect(await guard()).toBeUndefined()
  })

  it('sends a signed-out visitor to /login, never through, when the site has no login page of Druxt\'s', async () => {
    (useNuxtApp().$druxt.options.auth as DruxtPublicAuthOptions).login = false
    expect(await guard()).toEqual({ path: '/login', query: { redirect: '/account?tab=edits' } })
  })
})
