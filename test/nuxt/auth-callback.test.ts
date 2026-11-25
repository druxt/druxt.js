import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useNuxtApp } from '#imports'
// Auto-imported only when druxt.auth is set, which the typecheck app does not set.
import { useDruxtAuth } from '../../packages/core/src/runtime/auth'
import DruxtAuthCallback from '../../packages/core/src/runtime/pages/DruxtAuthCallback'
import { drupal, index, json } from '../unit/fake-drupal'
import type { Call } from '../unit/fake-drupal'
import { settle } from './helpers'

// A sign-in reloads the app on its target, and a visitor already signed in goes on there: recorded here instead.
const { reload, navigate } = vi.hoisted(() => ({ reload: vi.fn(), navigate: vi.fn() }))
mockNuxtImport('reloadNuxtApp', () => reload)
mockNuxtImport('navigateTo', () => navigate)

// useDruxtAuth()'s own sessionStorage key for the authorize flow in progress.
const FLOW_KEY = 'druxt.auth.flow'
const REDIRECT_URI = `${window.location.origin}/callback`
const REFUSED = 'The sign-in did not come from this site, or was already used.'

let calls: Call[]
/** The token requests made, Drupal's or the site's own route, as their form fields. */
const tokenRequests = () => calls.filter((call) => call.method === 'POST' && /\/(?:oauth|auth)\/token$/.test(call.url)).map((call) => Object.fromEntries(new URLSearchParams(String(call.body))))

/** The flow loginWithDrupal() stores before it sends the visitor to Drupal. */
const startFlow = (flow: Record<string, string> = {}) => sessionStorage.setItem(FLOW_KEY, JSON.stringify({ state: 'expected-state', verifier: 'the-verifier', redirect: '/account', redirectUri: REDIRECT_URI, ...flow }))

/** useDruxtAuth(), as a component's setup gets it. */
const auth = async () => {
  let composable: ReturnType<typeof useDruxtAuth> | undefined
  await mountSuspended(defineComponent({
    setup() {
      composable = useDruxtAuth()
      return () => h('p')
    },
  }))
  return composable!
}

beforeEach(() => {
  useNuxtApp().$druxt.auth?.clearTokens()
  sessionStorage.clear()
  reload.mockReset()
  navigate.mockReset()
  const token = () => json({ access_token: 'code-access', refresh_token: 'code-refresh', token_type: 'Bearer', expires_in: 300 })
  const fake = drupal({
    'GET /jsonapi': index(),
    'POST /oauth/token': token,
    [`POST ${window.location.origin}/api/_druxt/auth/token`]: token,
  })
  calls = fake.calls
  vi.stubGlobal('fetch', fake.fetch)
})

afterEach(() => {
  useNuxtApp().$druxt.auth?.clearTokens()
})

describe('useDruxtAuth().handleCallback()', () => {
  it('exchanges the code with the stored verifier when the state matches, then reloads on the target', async () => {
    startFlow()
    await (await auth()).handleCallback({ code: 'the-code', state: 'expected-state' })
    expect(tokenRequests()).toEqual([expect.objectContaining({ grant_type: 'authorization_code', code: 'the-code', code_verifier: 'the-verifier', redirect_uri: REDIRECT_URI })])
    expect(useNuxtApp().$druxt.auth!.loggedIn).toBe(true)
    expect(reload).toHaveBeenCalledWith({ path: '/account', force: true })
    expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
  })

  it.each([
    ['another state', { code: 'the-code', state: 'forged-state' }],
    ['no state', { code: 'the-code' }],
    ['a state that is not a string', { code: 'the-code', state: ['expected-state'] }],
    ['no code', { state: 'expected-state' }],
  ])('refuses a callback with %s, exchanging nothing, and forgets the flow', async (_, query) => {
    startFlow()
    await expect((await auth()).handleCallback(query)).rejects.toThrow(REFUSED)
    expect(tokenRequests()).toEqual([])
    expect(reload).not.toHaveBeenCalled()
    expect(useNuxtApp().$druxt.auth!.loggedIn).toBe(false)
    expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
  })

  it('refuses a callback when no sign-in was started from this browser', async () => {
    await expect((await auth()).handleCallback({ code: 'the-code', state: 'expected-state' })).rejects.toThrow(REFUSED)
    expect(tokenRequests()).toEqual([])
  })

  it('refuses a replay of a callback it already took, exchanging the code once', async () => {
    startFlow()
    const composable = await auth()
    await composable.handleCallback({ code: 'the-code', state: 'expected-state' })
    // Replayed once the visitor has signed out again.
    useNuxtApp().$druxt.auth!.clearTokens()
    await expect(composable.handleCallback({ code: 'the-code', state: 'expected-state' })).rejects.toThrow(REFUSED)
    expect(tokenRequests()).toHaveLength(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('useDruxtAuth().handleCallback(), for a visitor already signed in', () => {
  const signIn = () => useNuxtApp().$druxt.auth!.setTokens({ access_token: 'first-access', refresh_token: 'first-refresh', expires_in: 300 }, 'druxt')

  it('sends them on to where they were going, with no new sign-in, and forgets the flow', async () => {
    signIn()
    startFlow()
    await (await auth()).handleCallback({ code: 'the-code', state: 'expected-state' })
    expect(tokenRequests()).toEqual([])
    expect(reload).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/account', { replace: true })
    expect(useNuxtApp().$druxt.auth!.accessToken).toBe('first-access')
    expect(sessionStorage.getItem(FLOW_KEY)).toBeNull()
  })

  it('sends them to the front page for a callback this browser did not start, or a redirect off the site', async () => {
    signIn()
    await (await auth()).handleCallback({ code: 'the-code', state: 'forged-state' })
    expect(navigate).toHaveBeenLastCalledWith('/', { replace: true })
    startFlow({ redirect: '//elsewhere.example' })
    await (await auth()).handleCallback({ code: 'the-code', state: 'expected-state' })
    expect(navigate).toHaveBeenLastCalledWith('/', { replace: true })
    expect(tokenRequests()).toEqual([])
  })
})

describe('the page a sign-in returns to', () => {
  it.each(['https://elsewhere.example/account', '//elsewhere.example/account', '/\\elsewhere.example', 'account'])('is the front page for a redirect of %s, which is no path on this site', async (redirect) => {
    startFlow({ redirect })
    await (await auth()).handleCallback({ code: 'the-code', state: 'expected-state' })
    expect(useNuxtApp().$druxt.auth!.loggedIn).toBe(true)
    expect(reload).toHaveBeenCalledWith({ path: '/', force: true })
  })

  it('keeps a path on this site, with its query and hash', async () => {
    startFlow({ redirect: '/account?tab=edits#latest' })
    await (await auth()).handleCallback({ code: 'the-code', state: 'expected-state' })
    expect(reload).toHaveBeenCalledWith({ path: '/account?tab=edits#latest', force: true })
  })
})

describe('DruxtAuthCallback', () => {
  it('shows the refusal for a callback whose state does not match, and exchanges nothing', async () => {
    startFlow()
    const wrapper = await mountSuspended(DruxtAuthCallback, { route: '/callback?code=the-code&state=forged-state' })
    await settle(() => expect(wrapper.text()).toBe(REFUSED))
    expect(tokenRequests()).toEqual([])
  })

  it('shows a message for the visitor, never Drupal\'s own text, when Drupal refuses the code', async () => {
    const refused = () => json({ error: 'invalid_grant', error_description: 'The authorization code has expired at drupal.internal.' }, 400)
    const fake = drupal({ 'GET /jsonapi': index(), 'POST /oauth/token': refused, [`POST ${window.location.origin}/api/_druxt/auth/token`]: refused })
    calls = fake.calls
    vi.stubGlobal('fetch', fake.fetch)
    startFlow()
    const wrapper = await mountSuspended(DruxtAuthCallback, { route: '/callback?code=the-code&state=expected-state' })
    await settle(() => expect(tokenRequests()).toHaveLength(1))
    await settle(() => expect(wrapper.text()).not.toBe('Signing in…'))
    expect(wrapper.text()).toBe('Sign in failed. Try again.')
    expect(reload).not.toHaveBeenCalled()
  })

  it('says a visitor who is already signed in is signed in, and sends them on with no new sign-in', async () => {
    useNuxtApp().$druxt.auth!.setTokens({ access_token: 'first-access', expires_in: 300 }, 'druxt')
    startFlow()
    const wrapper = await mountSuspended(DruxtAuthCallback, { route: '/callback?code=the-code&state=expected-state' })
    expect(wrapper.text()).toBe('You are signed in.')
    await settle(() => expect(navigate).toHaveBeenCalledWith('/account', { replace: true }))
    expect(tokenRequests()).toEqual([])
  })

  it('signs in from the callback\'s query and reloads on the target', async () => {
    startFlow()
    await mountSuspended(DruxtAuthCallback, { route: '/callback?code=the-code&state=expected-state' })
    await settle(() => expect(reload).toHaveBeenCalledWith({ path: '/account', force: true }))
    expect(tokenRequests()).toHaveLength(1)
  })
})
