import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { hidesBaseUrl, splitDruxtConfig } from '../../packages/core/src/utils/config'
import { browserBaseUrl, hiddenBaseUrl, stripBaseUrl } from '../../packages/core/src/runtime/utils/origin'
import type { DruxtOptions } from '../../packages/core/src/module'
import { druxtClientOptions } from '../../packages/core/src/runtime/utils/client-options'
import { DRUXT_SETTINGS_DRUPAL_KEY, configSource, connectionName, settingsOnly, writeRequestTiers } from '../../packages/core/src/runtime/utils/drupal-settings'
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

describe('hidesBaseUrl()', () => {
  const server = { enabled: false, files: false, hybrid: false }
  const generated = { enabled: true, files: true, hybrid: false }

  it('hides Drupal\'s address on a static build that copies its files and signs nobody in', () => {
    expect(hidesBaseUrl({}, generated)).toBe(true)
    expect(hidesBaseUrl({ filesUrl: 'https://files.example.com' }, { ...generated, files: false })).toBe(true)
  })

  it('keeps it on a static build whose browser still uses it', () => {
    // File URLs are made on it, a page that was not built is asked of it, and a sign-in goes to it.
    expect(hidesBaseUrl({}, { ...generated, files: false })).toBe(false)
    expect(hidesBaseUrl({}, { ...generated, hybrid: true })).toBe(false)
    expect(hidesBaseUrl({ auth: { clientId: 'a', authorizeUrl: 'https://id.example.com/authorize' } }, generated)).toBe(false)
  })

  it('hides it on a server that proxies the API and the files, with no sign-in or one of the site\'s own address', () => {
    expect(hidesBaseUrl({ proxy: { api: true, files: true } }, server)).toBe(true)
    expect(hidesBaseUrl({ proxy: { api: true }, filesUrl: 'https://files.example.com' }, server)).toBe(true)
    expect(hidesBaseUrl({ proxy: { api: true, files: true }, auth: { clientId: 'a', authorizeUrl: 'https://id.example.com/authorize' } }, server)).toBe(true)
  })

  it('keeps it on a server whose browser reaches Drupal, takes its files from it, or is sent to it to sign in', () => {
    expect(hidesBaseUrl({}, server)).toBe(false)
    expect(hidesBaseUrl({ proxy: { files: true } }, server)).toBe(false)
    expect(hidesBaseUrl({ proxy: { api: true } }, server)).toBe(false)
    expect(hidesBaseUrl({ proxy: { api: true, files: true }, auth: { clientId: 'a' } }, server)).toBe(false)
  })
})

describe('hiddenBaseUrl() and browserBaseUrl()', () => {
  it('gives a page the path Drupal is served under, and no host', () => {
    expect(hiddenBaseUrl('https://drupal.example.com')).toBe('')
    expect(hiddenBaseUrl('http://127.0.0.1:8888/')).toBe('')
    expect(hiddenBaseUrl('https://example.com/drupal/')).toBe('/drupal')
    expect(hiddenBaseUrl('not a url')).toBe('')
  })

  it('takes the address out of the config script of a page with no server render', () => {
    const script = '<script>window.__NUXT__={};window.__NUXT__.config={public:{druxt:{baseUrl:"https://drupal.example.com/d",endpoint:"/jsonapi"}}}</script>'
    expect(stripBaseUrl(script, 'https://drupal.example.com/d')).toBe('<script>window.__NUXT__={};window.__NUXT__.config={public:{druxt:{baseUrl:"/d",endpoint:"/jsonapi"}}}</script>')
    // Markup that is not Nuxt's config is left byte for byte.
    expect(stripBaseUrl('<a href="https://drupal.example.com/d">baseUrl:"https://drupal.example.com/d"</a>', 'https://drupal.example.com/d')).toContain('baseUrl:"https://drupal.example.com/d"')
  })

  it('gives the browser the site\'s own origin, with that path', () => {
    expect(browserBaseUrl('', 'https://site.example.com')).toBe('https://site.example.com')
    expect(browserBaseUrl('/drupal', 'https://site.example.com')).toBe('https://site.example.com/drupal')
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

describe('the server tier', () => {
  const event = () => ({ path: '/', context: {} }) as unknown as H3Event

  beforeEach(() => {
    storage.clear()
    runtime.config = {
      druxt: { auth: { clientSecret: 'auth-secret' }, cache: { secret: '' }, build: { auth: { clientId: '', scope: '' } } },
      public: { druxt: { baseUrl: 'https://drupal.test', siteUrl: '', router: { wildcard: false } } },
    }
  })

  it('resolves only the defaults and the config without a fetcher', async () => {
    const { useDruxtServerSettings } = await import('../../packages/core/src/runtime/server/settings')
    const { storedDrupalSettings } = await import('../../packages/core/src/runtime/server/storage')
    const e = event()
    e.context.druxtStoredSettings = storedDrupalSettings(e)
    // No client options, and no credentials: those are not settings.
    expect(await useDruxtServerSettings(e)).toEqual({ develMessages: 'devtools', router: { wildcard: false } })
  })

  it('stores both tiers at server start, then resolves the public tier, the server tier and the config in order', async () => {
    const { useDruxtServerSettings } = await import('../../packages/core/src/runtime/server/settings')
    const { storeDrupalSettings, storedDrupalSettings } = await import('../../packages/core/src/runtime/server/storage')
    await storeDrupalSettings('default', { public: { siteUrl: 'https://from-drupal.test', router: { wildcard: true, canonical: false }, shared: 'public' } })
    await storeDrupalSettings('default', { server: { apiKey: 'drupal-key', shared: 'server', proxy: { api: true } } })
    expect(storage.get('settings:default')).toEqual({
      public: { siteUrl: 'https://from-drupal.test', router: { wildcard: true, canonical: false }, shared: 'public' },
      server: { apiKey: 'drupal-key', shared: 'server', proxy: { api: true } },
    })

    const e = event()
    e.context.druxtStoredSettings = storedDrupalSettings(e)
    const settings = await useDruxtServerSettings(e)
    // An empty siteUrl in the config does not erase Drupal's.
    expect(settings.siteUrl).toBe('https://from-drupal.test')
    // The config wins over Drupal, and the server tier over the public tier.
    expect(settings.router).toEqual({ wildcard: false, canonical: false })
    expect(settings).toMatchObject({ apiKey: 'drupal-key', shared: 'server' })
    // Drupal cannot set how the client reaches it.
    expect(settings).not.toHaveProperty('proxy')
    expect(secretKeys(settings)).toEqual([])
  })

  it('keeps both tiers of two writes that overlap, one tier each', async () => {
    const { storeDrupalSettings } = await import('../../packages/core/src/runtime/server/storage')
    await Promise.all([
      storeDrupalSettings('default', { public: { siteUrl: 'https://from-drupal.test' } }),
      storeDrupalSettings('default', { server: { apiKey: 'drupal-key' } }),
      storeDrupalSettings('default', { public: { siteUrl: 'https://later.test' } }),
    ])
    expect(storage.get('settings:default')).toEqual({ public: { siteUrl: 'https://later.test' }, server: { apiKey: 'drupal-key' } })
  })

  it('writes after a write that failed, which rejects for its own caller alone', async () => {
    const { storeDrupalSettings } = await import('../../packages/core/src/runtime/server/storage')
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const [failed, stored] = await Promise.allSettled([
      storeDrupalSettings('default', { public: circular }),
      storeDrupalSettings('default', { server: { apiKey: 'drupal-key' } }),
    ])
    expect(failed.status).toBe('rejected')
    expect(stored.status).toBe('fulfilled')
    expect(storage.get('settings:default')).toEqual({ server: { apiKey: 'drupal-key' } })
  })

  it('puts a request\'s own tiers in place of the stored ones, and stores nothing for a request', async () => {
    const { useDruxtServerSettings } = await import('../../packages/core/src/runtime/server/settings')
    const { storeDrupalSettings } = await import('../../packages/core/src/runtime/server/storage')
    const e = event()
    e.context.druxtStoredSettings = async () => ({ public: { a: 'stored', c: 'stored' }, server: { b: 'stored', d: 'stored' } })
    await storeDrupalSettings('default', { server: { b: 'request' } }, e)
    writeRequestTiers(e.context, 'default', { public: { a: 'request' } })
    const settings = await useDruxtServerSettings(e)
    expect(settings).toMatchObject({ a: 'request', b: 'request' })
    expect(settings).not.toHaveProperty('c')
    expect(settings).not.toHaveProperty('d')
    expect(storage.size).toBe(0)
  })
})
