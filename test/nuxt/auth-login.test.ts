import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { enableAutoUnmount } from '@vue/test-utils'
import { defineComponent, h, resolveComponent } from 'vue'
import { useNuxtApp, useRouter, useState } from '#imports'
// Auto-imported only when druxt.auth is set, which the typecheck app does not set.
import { DRUXT_AUTH_SIGNED_IN, useDruxtAuth } from '../../packages/core/src/runtime/auth'
import DruxtAuthLoginPage from '../../packages/core/src/runtime/pages/DruxtAuthLoginPage'
import { BASE_URL, drupal, index, json } from '../unit/fake-drupal'
import type { Call } from '../unit/fake-drupal'
import { settle } from './helpers'

enableAutoUnmount(afterEach)

// A sign-in and a sign-out reload the app, and the login page sends a signed-in visitor on: recorded here instead.
const { reload, navigate } = vi.hoisted(() => ({ reload: vi.fn(), navigate: vi.fn() }))
mockNuxtImport('reloadNuxtApp', () => reload)
mockNuxtImport('navigateTo', () => navigate)

// The browser's password grant, per plugin.ts, goes through this origin's
// own route (which holds the client secret), never straight to Drupal.
const TOKEN_URL = `${window.location.origin}/api/_druxt/auth/token`
// composable.ts's own sessionStorage key for the authorize flow in progress.
const FLOW_KEY = 'druxt.auth.flow'

const mountLogin = (props: Record<string, unknown> = {}) => mountSuspended(defineComponent({
  setup: () => () => h(resolveComponent('DruxtAuthLogin'), props),
}))

describe('DruxtAuthLogin', () => {
  beforeEach(() => {
    // This file's one Vue app keeps one DruxtClient and its cookie-backed
    // tokens across mounts; clear them so each test starts signed out.
    useNuxtApp().$druxt.auth?.clearTokens()
    useState('druxt-auth-user').value = null
    sessionStorage.clear()
    reload.mockReset()
    navigate.mockReset()
  })

  // vi.spyOn() returns the existing mock when a target is already spied on,
  // so a later test's wait on `assign` would otherwise be satisfied by an
  // earlier test's call.
  afterEach(() => vi.restoreAllMocks())

  it('signs in with a username and password', async () => {
    vi.stubGlobal('fetch', drupal({
      'GET /jsonapi': index(),
      [`POST ${TOKEN_URL}`]: () => json({ access_token: 'abc123', token_type: 'Bearer' }),
      'GET /oauth/userinfo': () => json({ sub: '1', name: 'Editor' }),
    }).fetch)

    // DruxtAuthLogin is a child the mounted host merely resolves by name, so
    // wrapper.emitted() (which tracks the host's own events) would see
    // nothing: its events are captured directly, as onXxx listener props.
    const onSubmit = vi.fn()
    const onSuccess = vi.fn()
    const wrapper = await mountLogin({ onSubmit, onSuccess })
    await settle()
    await wrapper.find('input[name="name"]').setValue('editor')
    await wrapper.find('input[name="pass"]').setValue('secret')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())

    expect(onSubmit).toHaveBeenCalledWith({ name: 'editor' })
    // Signed in, the form gives way to who is signed in, until the reload, and keeps no password.
    await settle(() => expect(wrapper.find('.druxt-auth-login__user').text()).toBe('Signed in as Editor.'))
    expect(wrapper.find('input').exists()).toBe(false)
    expect(reload).toHaveBeenCalledWith({ path: '/', force: true })
  })

  it('shows the visitor-facing message and emits error on a failed sign-in', async () => {
    vi.stubGlobal('fetch', drupal({
      'GET /jsonapi': index(),
      [`POST ${TOKEN_URL}`]: () => json({ error: 'invalid_grant', error_description: 'The user credentials were incorrect.' }, 401),
    }).fetch)

    const onError = vi.fn()
    const wrapper = await mountLogin({ onError })
    await settle()
    await wrapper.find('input[name="name"]').setValue('editor')
    await wrapper.find('input[name="pass"]').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))

    const message = 'Check the username and password, then try again. Repeated attempts are blocked for a while.'
    expect(wrapper.find('[role="alert"]').text()).toBe(message)
    expect(onError).toHaveBeenCalledWith(message)
  })

  it('starts the Drupal sign-in redirect for the resolved target', async () => {
    vi.stubGlobal('fetch', drupal({ 'GET /jsonapi': index() }).fetch)
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})

    const wrapper = await mountLogin()
    await settle()
    await wrapper.find('button.druxt-auth-login__drupal').trigger('click')
    await vi.waitFor(() => expect(assign).toHaveBeenCalled())

    const url = new URL(String(assign.mock.calls[0]![0]))
    expect(url.origin + url.pathname).toBe(`${BASE_URL}/oauth/authorize`)
    expect(url.searchParams.get('client_id')).toBe('druxt-test')
    expect(url.searchParams.get('redirect_uri')).toBe(`${window.location.origin}/callback`)

    const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}') as { redirect?: string }
    expect(flow.redirect).toBe('/')
  })

  it('a redirect prop overrides the default target', async () => {
    vi.stubGlobal('fetch', drupal({ 'GET /jsonapi': index() }).fetch)
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})

    const wrapper = await mountLogin({ redirect: '/account' })
    await settle()
    await wrapper.find('button.druxt-auth-login__drupal').trigger('click')
    await vi.waitFor(() => expect(assign).toHaveBeenCalled())

    const flow = JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}') as { redirect?: string }
    expect(flow.redirect).toBe('/account')
  })
})

/** Signs the app's client in as the editor, as a reload after a sign-in finds it. */
const signInAs = (name = 'Editor') => {
  useNuxtApp().$druxt.auth!.setTokens({ access_token: 'first-access', refresh_token: 'first-refresh', expires_in: 300 }, 'druxt')
  useState('druxt-auth-user').value = { sub: '1', name }
}

describe('DruxtAuthLogin, signed in', () => {
  let calls: Call[]
  beforeEach(() => {
    useNuxtApp().$druxt.auth?.clearTokens()
    sessionStorage.clear()
    reload.mockReset()
    const fake = drupal({
      'GET /jsonapi': index(),
      [`POST ${TOKEN_URL}`]: () => json({ access_token: 'second-access', token_type: 'Bearer' }),
      'GET /oauth/userinfo': () => json({ sub: '2', name: 'Other' }),
    })
    calls = fake.calls
    vi.stubGlobal('fetch', fake.fetch)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    useNuxtApp().$druxt.auth?.clearTokens()
    useState('druxt-auth-user').value = null
  })
  const tokenRequests = () => calls.filter((call) => call.method === 'POST' && call.url === TOKEN_URL)

  it('shows who is signed in and a sign-out button, and no fields', async () => {
    signInAs()
    const wrapper = await mountLogin()
    await settle()
    expect(wrapper.find('.druxt-auth-login').classes()).toContain('druxt-auth-login--signed-in')
    expect(wrapper.find('.druxt-auth-login__user').text()).toBe('Signed in as Editor.')
    const button = wrapper.find('button.druxt-auth-login__sign-out')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Sign out')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('button.druxt-auth-login__drupal').exists()).toBe(false)
  })

  it('says the visitor is signed in when their name is not known', async () => {
    signInAs()
    useState('druxt-auth-user').value = null
    const wrapper = await mountLogin()
    await settle()
    expect(wrapper.find('.druxt-auth-login__user').text()).toBe('You are signed in.')
  })

  it('sends nothing for a sign-in attempted while signed in, by password or with Drupal', async () => {
    signInAs()
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    const onSubmit = vi.fn()
    let given: { loggedIn?: boolean, submit?: () => Promise<void>, signInWithDrupal?: () => Promise<void>, credentials?: { name: string, pass: string } } = {}
    await mountSuspended(defineComponent({
      setup: () => () => h(resolveComponent('DruxtAuthLogin'), { onSubmit }, {
        default: (props: typeof given) => {
          given = props
          return h('p', 'Template')
        },
      }),
    }))
    await settle()
    expect(given.loggedIn).toBe(true)
    given.credentials!.name = 'other'
    given.credentials!.pass = 'secret'
    await given.submit!()
    await given.signInWithDrupal!()
    await settle()
    expect(tokenRequests()).toEqual([])
    expect(onSubmit).not.toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('first-access')
  })

  it('signs out and reloads the page it is on, where the form is back', async () => {
    signInAs()
    const wrapper = await mountLogin()
    await settle()
    await wrapper.find('button.druxt-auth-login__sign-out').trigger('click')
    await settle(() => expect(reload).toHaveBeenCalledWith({ path: '/', force: true }))
    expect(useNuxtApp().$druxt.auth!.loggedIn).toBe(false)
    expect(useState('druxt-auth-user').value).toBeNull()

    // The reloaded page: signed out, the form.
    const after = await mountLogin()
    await settle()
    expect(after.find('input[name="name"]').exists()).toBe(true)
    expect(after.find('.druxt-auth-login__sign-out').exists()).toBe(false)
  })

  it('renders a DruxtAuthLoginSignedIn wrapper of the site\'s for the signed-in state, and the site\'s form wrapper never', async () => {
    const components = useNuxtApp().vueApp._context.components
    components.DruxtAuthLoginSignedIn = defineComponent({
      props: ['user', 'signOut'],
      setup: (props) => () => h('p', { class: 'site-signed-in' }, `Hello ${(props.user as { name?: string } | null)?.name}`),
    })
    components.DruxtAuthLoginDefault = defineComponent({ setup: () => () => h('form', { class: 'site-form' }) })
    try {
      signInAs()
      const wrapper = await mountLogin()
      await settle()
      expect(wrapper.find('.site-signed-in').text()).toBe('Hello Editor')
      expect(wrapper.find('.site-form').exists()).toBe(false)
    } finally {
      delete components.DruxtAuthLoginSignedIn
      delete components.DruxtAuthLoginDefault
    }
  })
})

describe('DruxtAuthLoginPage', () => {
  beforeEach(() => {
    useNuxtApp().$druxt.auth?.clearTokens()
    navigate.mockReset()
    vi.stubGlobal('fetch', drupal({ 'GET /jsonapi': index() }).fetch)
  })
  afterEach(() => {
    useNuxtApp().$druxt.auth?.clearTokens()
    useState('druxt-auth-user').value = null
  })

  it('sends a visitor who is already signed in on to where they were going, without a sign-in', async () => {
    signInAs()
    await mountSuspended(DruxtAuthLoginPage, { route: '/user/login?redirect=/account' })
    expect(navigate).toHaveBeenCalledWith('/account', { replace: true })
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('first-access')
  })

  it('sends a signed-in visitor to the front page for a redirect off the site', async () => {
    signInAs()
    await mountSuspended(DruxtAuthLoginPage, { route: '/user/login?redirect=//elsewhere.example' })
    expect(navigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('shows the form to a signed-out visitor', async () => {
    const wrapper = await mountSuspended(DruxtAuthLoginPage, { route: '/user/login?redirect=/account' })
    await settle()
    expect(navigate).not.toHaveBeenCalled()
    expect(wrapper.find('input[name="name"]').exists()).toBe(true)
  })
})

describe('useDruxtAuth()', () => {
  let calls: Call[]
  beforeEach(() => {
    useNuxtApp().$druxt.auth?.clearTokens()
    useState('druxt-auth-user').value = null
    sessionStorage.clear()
    reload.mockReset()
    const fake = drupal({
      'GET /jsonapi': index(),
      [`POST ${TOKEN_URL}`]: () => json({ access_token: 'second-access', token_type: 'Bearer' }),
      'GET /oauth/userinfo': () => json({ sub: '2', name: 'Other' }),
    })
    calls = fake.calls
    vi.stubGlobal('fetch', fake.fetch)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    useNuxtApp().$druxt.auth?.clearTokens()
    useState('druxt-auth-user').value = null
  })
  const tokenRequests = () => calls.filter((call) => call.method === 'POST' && call.url === TOKEN_URL)
  /** useDruxtAuth(), as a component's setup gets it. */
  const composable = async () => {
    let auth: ReturnType<typeof useDruxtAuth> | undefined
    await mountSuspended(defineComponent({
      setup() {
        auth = useDruxtAuth()
        return () => h('p')
      },
    }))
    return auth!
  }

  it('fetches no user while signed out: undefined from fetchUser(), null in the state', async () => {
    const seen: { fetched?: unknown, user?: unknown } = {}
    await mountSuspended(defineComponent({
      async setup() {
        const auth = useDruxtAuth()
        seen.fetched = await auth.fetchUser()
        seen.user = auth.user.value
        return () => h('p')
      },
    }))
    expect(seen.fetched).toBeUndefined()
    expect(seen.user).toBeNull()
  })

  it('refuses loginWithPassword() while signed in, with a DRUXT_AUTH_SIGNED_IN error, and sends nothing', async () => {
    signInAs()
    const auth = await composable()
    await expect(auth.loginWithPassword({ username: 'other', password: 'secret' })).rejects.toMatchObject({ name: DRUXT_AUTH_SIGNED_IN })
    expect(tokenRequests()).toEqual([])
    expect(reload).not.toHaveBeenCalled()
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('first-access')
    expect(useState('druxt-auth-user').value).toEqual({ sub: '1', name: 'Editor' })
  })

  it('refuses loginWithDrupal() while signed in, with a DRUXT_AUTH_SIGNED_IN error, and does not redirect', async () => {
    signInAs()
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    const auth = await composable()
    await expect(auth.loginWithDrupal('/account')).rejects.toMatchObject({ name: DRUXT_AUTH_SIGNED_IN })
    expect(assign).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
    expect(tokenRequests()).toEqual([])
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('first-access')
    expect(useState('druxt-auth-user').value).toEqual({ sub: '1', name: 'Editor' })
  })

  it('signs in with loginWithPassword() while signed out', async () => {
    const auth = await composable()
    await auth.loginWithPassword({ username: 'other', password: 'secret' }, '/account')
    expect(tokenRequests()).toHaveLength(1)
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('second-access')
    expect(useState('druxt-auth-user').value).toMatchObject({ name: 'Other' })
    expect(reload).toHaveBeenCalledWith({ path: '/account', force: true })
  })

  it('starts the Drupal sign-in with loginWithDrupal() while signed out', async () => {
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    const auth = await composable()
    await auth.loginWithDrupal('/account')
    expect(new URL(String(assign.mock.calls[0]![0])).pathname).toBe('/oauth/authorize')
    expect(JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}')).toMatchObject({ redirect: '/account' })
  })

  // Under `app.baseURL: '/portal/'`, Vue Router gives each route's `href` with the base, and its `fullPath` without.
  const underBase = () => {
    const router = useRouter()
    const resolve = router.resolve.bind(router)
    vi.spyOn(router, 'resolve').mockImplementation(((to: never) => {
      const route = resolve(to)
      return { ...route, href: `/portal${route.href}` }
    }) as typeof router.resolve)
  }

  it('reloads under the app\'s base after a sign-in and a sign-out', async () => {
    underBase()
    const auth = await composable()
    await auth.loginWithPassword({ username: 'other', password: 'secret' }, '/account?tab=edits')
    expect(reload).toHaveBeenLastCalledWith({ path: '/portal/account?tab=edits', force: true })
    await auth.logout()
    expect(reload).toHaveBeenLastCalledWith({ path: '/portal/', force: true })
  })

  it('gives Drupal a callback under the app\'s base, and keeps it for the code exchange', async () => {
    underBase()
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    const auth = await composable()
    await auth.loginWithDrupal('/account')
    const callback = `${window.location.origin}/portal/callback`
    expect(new URL(String(assign.mock.calls[0]![0])).searchParams.get('redirect_uri')).toBe(callback)
    expect(JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}')).toMatchObject({ redirect: '/account', redirectUri: callback })
  })

  it('signs in as someone else once logout() has signed the visitor out', async () => {
    signInAs()
    const auth = await composable()
    await auth.logout()
    expect(useNuxtApp().$druxt.auth!.loggedIn).toBe(false)
    await auth.loginWithPassword({ username: 'other', password: 'secret' })
    expect(tokenRequests()).toHaveLength(1)
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('second-access')
    expect(useState('druxt-auth-user').value).toMatchObject({ name: 'Other' })
  })

  it('leaves no user from a session that ended on the page when a sign-in fails', async () => {
    vi.stubGlobal('fetch', drupal({
      'GET /jsonapi': index(),
      [`POST ${TOKEN_URL}`]: () => json({ error: 'invalid_grant', error_description: 'The user credentials were incorrect.' }, 401),
    }).fetch)
    // The session ended, such as on a refused refresh, and the page still holds its user.
    useState('druxt-auth-user').value = { sub: '1', name: 'First' }
    const auth = await composable()
    await expect(auth.loginWithPassword({ username: 'other', password: 'wrong' })).rejects.toMatchObject({ response: { status: 401 } })
    expect(useNuxtApp().$druxt.auth!.loggedIn).toBe(false)
    expect(useState('druxt-auth-user').value).toBeNull()
  })
})
