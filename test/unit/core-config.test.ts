import { describe, expect, it, vi } from 'vitest'
import { splitDruxtConfig } from '../../packages/core/src/utils/config'
import type { DruxtOptions } from '../../packages/core/src/module'
import { druxtClientOptions } from '../../packages/core/src/runtime/utils/client-options'
import { DRUXT_SETTINGS_DRUPAL_KEY, configSource, connectionName, settingsOnly } from '../../packages/core/src/runtime/utils/drupal-settings'
import type { DruxtPublicConfig } from '../../packages/core/src/runtime/types'

const runtime = vi.hoisted(() => ({ config: {} as Record<string, unknown>, defaults: {} as Record<string, unknown> }))
const storage = vi.hoisted(() => new Map<string, unknown>())

// The modules' defaults, written into the build.
vi.mock('#druxt/defaults', () => ({ default: runtime.defaults }))
vi.mock('#imports', () => ({ useRuntimeConfig: () => runtime.config }))
vi.mock('nitropack/runtime', () => ({
  useStorage: () => ({
    // A copy each way, as unstorage stores JSON.
    getItem: async (key: string) => storage.has(key) ? JSON.parse(JSON.stringify(storage.get(key))) : null,
    setItem: async (key: string, value: unknown) => { storage.set(key, JSON.parse(JSON.stringify(value))) },
  }),
}))

// Every key, at any depth, that names a secret.
const secretKeys = (value: unknown, path = ''): string[] => {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, inner]) => {
    const here = path ? `${path}.${key}` : key
    const named = ['clientSecret', 'secret', 'build'].includes(key) || (key === 'password' && typeof inner === 'string')
    return [...(named ? [here] : []), ...secretKeys(inner, here)]
  })
}

const options = (more: Partial<DruxtOptions> = {}): DruxtOptions => ({
  baseUrl: 'https://drupal.test',
  siteUrl: '',
  endpoint: '/jsonapi',
  proxy: { api: true },
  auth: { clientId: 'site', clientSecret: 'auth-secret', login: '/user/login', callback: '/callback', password: true },
  cache: { ttl: 60, secret: 'cache-secret' },
  build: { auth: { clientId: 'build', clientSecret: 'build-secret', username: 'bot', password: 'build-password', scope: 'druxt_build' } },
  router: { wildcard: true },
  ...more,
})

describe('splitDruxtConfig()', () => {
  it('puts no secret in the public config', () => {
    const split = splitDruxtConfig(options())
    expect(secretKeys(split.public)).toEqual([])
    expect(split.public).toMatchObject({ baseUrl: 'https://drupal.test', auth: { clientId: 'site', password: true }, cache: { ttl: 60 }, router: { wildcard: true } })
  })

  it('puts the auth and cache secrets under the private config, and every key the environment can set', () => {
    expect(splitDruxtConfig(options()).private).toEqual({
      auth: { clientSecret: 'auth-secret' },
      cache: { secret: 'cache-secret' },
      proxy: { trustForwarded: false, sessionCookie: '' },
      // The build's own credentials stay in the build: the server's come from the environment at runtime.
      build: { auth: { clientId: '', clientSecret: '', username: '', password: '', scope: 'druxt_build' } },
    })
  })

  it('leaves each private key present and empty when nothing sets it', () => {
    const split = splitDruxtConfig(options({ auth: undefined, cache: false, build: undefined }))
    expect(split.private).toEqual({
      auth: { clientSecret: '' },
      cache: { secret: '' },
      proxy: { trustForwarded: false, sessionCookie: '' },
      build: { auth: { clientId: '', clientSecret: '', username: '', password: '', scope: '' } },
    })
    expect(split.public.cache).toBe(false)
    expect(split.public).not.toHaveProperty('auth')
  })

  it('keeps the proxy\'s trust in a front proxy on the server, out of the public config', () => {
    const split = splitDruxtConfig(options({ proxy: { api: true, files: true, trustForwarded: true } }))
    expect(split.private.proxy).toEqual({ trustForwarded: true, sessionCookie: '' })
    expect(split.public.proxy).toEqual({ api: true, files: true })
    expect(JSON.stringify(split.public)).not.toContain('trustForwarded')
  })

  it('gives the proxy the site\'s session cookie pattern, with the cache on, or off as in development', () => {
    expect(splitDruxtConfig(options({ cache: { sessionCookie: 'site_session' } })).private.proxy.sessionCookie).toBe('site_session')
    expect(splitDruxtConfig(options({ cache: false }), 'site_session').private.proxy.sessionCookie).toBe('site_session')
  })

  it('lists named connections other than default as ignored, and keeps connections out of the public config', () => {
    const split = splitDruxtConfig(options({ connections: { default: { baseUrl: 'x' }, other: { baseUrl: 'https://other.test' } } }))
    expect(split.ignored).toEqual(['other'])
    expect(split.public).not.toHaveProperty('connections')
    expect(splitDruxtConfig(options()).ignored).toEqual([])
  })
})

describe('druxtClientOptions()', () => {
  const config = splitDruxtConfig(options()).public as DruxtPublicConfig

  it('gives the browser the proxy and the password route, and no secret', () => {
    const browser = druxtClientOptions(config, { server: false, origin: 'https://site.test' })
    expect(browser.proxy).toEqual({ api: true })
    expect(browser.auth).toMatchObject({ clientId: 'site', passwordTokenUrl: 'https://site.test/api/_druxt/auth/token', authorizeUrl: 'https://drupal.test/oauth/authorize' })
    expect(secretKeys(browser)).toEqual([])
  })

  it('sends the server straight to Drupal, with the secret', () => {
    const server = druxtClientOptions(config, { server: true, clientSecret: 'auth-secret' })
    expect(server.proxy).toEqual({ api: false })
    expect(server.auth).toMatchObject({ clientId: 'site', clientSecret: 'auth-secret' })
    expect(server.auth).not.toHaveProperty('passwordTokenUrl')
    // The public config is left as it was.
    expect(config.proxy).toEqual({ api: true })
  })

  it.each([true, false].flatMap((session) => [true, false, undefined].map((password) => ({ password, session }))))(
    'gives the browser the password route only when the grant is offered, with password $password and session $session',
    ({ password, session }) => {
      const auth = { ...config.auth!, session, ...(password === undefined ? {} : { password }) }
      if (password === undefined) delete (auth as { password?: boolean }).password
      const browser = druxtClientOptions({ ...config, auth } as DruxtPublicConfig, { server: false, origin: 'https://site.test' })
      const route = 'https://site.test/api/_druxt/auth/token'
      // Unset at runtime is as before the flag was read: offered.
      if (password === false) expect(browser.auth).not.toHaveProperty('passwordTokenUrl')
      else if (session || password) expect(browser.auth).toMatchObject({ passwordTokenUrl: route })
      else expect(browser.auth).not.toHaveProperty('passwordTokenUrl')
      // The session's own grants go to the route whatever the flag.
      if (session) expect(browser.auth).toMatchObject({ session: true, tokenUrl: route, logoutUrl: 'https://site.test/api/_druxt/auth/logout' })
    },
  )

  it('carries no module settings', () => {
    expect(druxtClientOptions(config, { server: true })).not.toHaveProperty('router')
  })
})

describe('configSource()', () => {
  it('drops undefined and empty keys at every depth, so they cannot erase a Drupal value', () => {
    expect(configSource({ siteUrl: '', a: undefined, router: { wildcard: undefined, canonical: false }, list: ['x'], n: 0 }))
      .toEqual({ router: { canonical: false }, list: ['x'], n: 0 })
    expect(configSource({ cache: { secret: '' }, proxy: {} })).toEqual({ proxy: {} })
    expect(configSource(undefined)).toBeUndefined()
  })
})

describe('settingsOnly()', () => {
  it('leaves out the client\'s options and the connection\'s credentials', () => {
    expect(settingsOnly({
      baseUrl: 'x', endpoint: 'x', proxy: {}, auth: {}, cache: {}, headers: {}, debug: true, jsonapiResourceConfig: 'x',
      build: {}, connections: {}, siteUrl: 'https://site.test', router: { wildcard: true },
    })).toEqual({ siteUrl: 'https://site.test', router: { wildcard: true } })
    expect(settingsOnly(undefined)).toBeUndefined()
  })
})

describe('connectionName()', () => {
  it('resolves every name to default, warning once per other name', () => {
    const warn = vi.fn()
    expect(connectionName(undefined, warn)).toBe('default')
    expect(connectionName('default', warn)).toBe('default')
    expect(warn).not.toHaveBeenCalled()
    expect(connectionName('shop', warn)).toBe('default')
    expect(connectionName('shop', warn)).toBe('default')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('"shop"')
  })

  it('names the state key per connection', () => {
    expect(DRUXT_SETTINGS_DRUPAL_KEY()).toBe('druxt:settings:drupal:default')
  })
})
