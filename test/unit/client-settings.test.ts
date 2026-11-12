import { describe, expect, expectTypeOf, it } from 'vitest'
import { DRUXT_CLIENT_KEYS, DruxtClient, clientOptions, connectionsFrom, mergeDeep, resolveDruxtSettings } from '../../packages/client/src'
import type { DruxtClientOptions, DruxtConfig, DruxtConnectionConfig, DruxtPublicAuthOptions } from '../../packages/client/src'
import { BASE_URL } from './fake-drupal'

describe('clientOptions', () => {
  const config: DruxtConfig = {
    baseUrl: BASE_URL,
    endpoint: '/jsonapi',
    auth: { clientId: 'druxt' },
    proxy: { api: true },
    cache: { ttl: 5 },
    headers: { 'x-a': 'b' },
    router: { wildcard: true },
    schema: { refresh: false },
    siteUrl: 'https://example.com',
    develMessages: 'inline',
    axios: { headers: { 'x-axios': '1' } },
  }

  it('keeps the client keys and drops the module settings', () => {
    const picked = clientOptions(config)
    expect(Object.keys(picked).sort()).toEqual(['auth', 'baseUrl', 'cache', 'endpoint', 'headers', 'proxy'])
    for (const key of ['router', 'schema', 'siteUrl', 'develMessages', 'axios']) expect(picked).not.toHaveProperty(key)
  })

  it('promises a baseUrl only when the input carries one', () => {
    expectTypeOf(clientOptions(config)).toEqualTypeOf<DruxtClientOptions & { baseUrl: string }>()
    const connection: DruxtConnectionConfig = { endpoint: '/api' }
    expectTypeOf(clientOptions(connection)).toEqualTypeOf<DruxtClientOptions>()
    expectTypeOf(clientOptions(connection).baseUrl).toEqualTypeOf<string | undefined>()
    expect(clientOptions(connection)).toEqual({ endpoint: '/api' })
  })

  it('returns a deep copy', () => {
    const picked = clientOptions(config)
    expect(picked).not.toBe(config)
    picked.endpoint = '/other'
    picked.proxy!.api = false
    picked.headers!['x-a'] = 'changed'
    expect(config.endpoint).toBe('/jsonapi')
    expect(config.proxy).toEqual({ api: true })
    expect(config.headers).toEqual({ 'x-a': 'b' })
  })

  it('lists the documented client keys', () => {
    expect(DRUXT_CLIENT_KEYS).toContain('jsonapiResourceConfig')
    expect(DRUXT_CLIENT_KEYS).toContain('warnOmitted')
    expect(DRUXT_CLIENT_KEYS).toContain('prefixes')
    expect(DRUXT_CLIENT_KEYS).not.toContain('axios')
    expect(DRUXT_CLIENT_KEYS).toHaveLength(13)
  })
})

type KnownKeys<T> = keyof { [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K] }

describe('DRUXT_CLIENT_KEYS', () => {
  it('covers every declared client option, and only those', () => {
    type Listed = typeof DRUXT_CLIENT_KEYS[number]
    expectTypeOf<Exclude<KnownKeys<DruxtClientOptions>, Listed>>().toEqualTypeOf<never>()
    expectTypeOf<Exclude<Listed, KnownKeys<DruxtClientOptions>>>().toEqualTypeOf<never>()
  })
})

describe('connectionsFrom', () => {
  // Core's flat auth keys beside the client's, which connectionsFrom() passes on to the browser.
  const auth = { clientId: 'browser', password: false, login: '/login', callback: '/callback' }
  const flat: DruxtConfig = {
    baseUrl: BASE_URL,
    endpoint: '/jsonapi',
    proxy: { api: true },
    auth,
    build: { auth: { clientId: 'server', clientSecret: 's3', scope: 'read', username: 'u', password: 'p' } },
    router: { wildcard: true },
  }

  it('maps the flat keys onto a Consumer and its two overrides', () => {
    const { connections, ignored } = connectionsFrom(flat)
    expect(ignored).toEqual([])
    expect(Object.keys(connections)).toEqual(['default'])
    expect(connections.default).toEqual({
      baseUrl: BASE_URL,
      endpoint: '/jsonapi',
      proxy: { api: true },
      browser: { clientId: 'browser', password: false, login: '/login', callback: '/callback' },
      consumer: { id: 'server', secret: 's3', scope: 'read', username: 'u', password: 'p' },
    })
    expect(connections.default).not.toHaveProperty('auth')
    expect(connections.default).not.toHaveProperty('router')
  })

  it('treats auth.clientId as the Consumer when there is no build.auth', () => {
    const { connections } = connectionsFrom({ baseUrl: BASE_URL, auth: { clientId: 'druxtjs_org' } })
    const connection = connections.default
    expect(connection.consumer?.id).toBe('druxtjs_org')
    expect(connection.browser?.clientId).toBe('druxtjs_org')
  })

  it('keeps a privileged build account apart from the browser\'s client', () => {
    const { connections } = connectionsFrom({
      baseUrl: BASE_URL,
      auth: { clientId: 'site' },
      build: { auth: { clientId: 'build', clientSecret: 'x' } },
    })
    const connection = connections.default
    expect(connection.consumer).toEqual({ id: 'build', secret: 'x' })
    expect(connection.browser?.clientId).toBe('site')
  })

  it('puts a flat auth secret on the Consumer when it is the same client', () => {
    const { connections } = connectionsFrom({ baseUrl: BASE_URL, auth: { clientId: 'a', clientSecret: 'shh' } as never })
    expect(connections.default.consumer).toEqual({ id: 'a', secret: 'shh' })
    expect(connections.default.browser).not.toHaveProperty('clientSecret')
    expect(connections.default.browser).not.toHaveProperty('secret')
  })

  it('puts a flat auth secret on the browser when it is another client', () => {
    const { connections } = connectionsFrom({ baseUrl: BASE_URL, auth: { clientId: 'a', clientSecret: 'shh' } as never, build: { auth: { clientId: 'b' } } })
    expect(connections.default.consumer).toEqual({ id: 'b' })
    expect(connections.default.browser).toEqual({ clientId: 'a', secret: 'shh' })
  })

  it('leaves out what a site does not set', () => {
    const connection = connectionsFrom({ baseUrl: BASE_URL, endpoint: '/jsonapi' }).connections.default
    expect(connection).toEqual({ baseUrl: BASE_URL, endpoint: '/jsonapi' })
  })

  it('reports a named connection and does not use it', () => {
    const other: DruxtConnectionConfig = { baseUrl: 'https://other.test' }
    const { connections, ignored } = connectionsFrom({ ...flat, connections: { default: other, shop: other, blog: other } })
    expect(ignored).toEqual(['shop', 'blog'])
    expect(connections.default.baseUrl).toBe(BASE_URL)
  })

  it('does not share objects with the config', () => {
    const { connections } = connectionsFrom(flat)
    connections.default.proxy!.api = false
    connections.default.consumer!.scope = 'write'
    expect(flat.proxy).toEqual({ api: true })
    expect(flat.build!.auth!.scope).toBe('read')
  })
})

describe('clientOptions from a connection', () => {
  it('maps the browser override to auth', () => {
    const { connections } = connectionsFrom({ baseUrl: BASE_URL, endpoint: '/jsonapi', auth: { clientId: 'b' }, build: { auth: { clientId: 's', clientSecret: 'x' } } })
    const picked = clientOptions(connections.default)
    expect(picked).toEqual({ baseUrl: BASE_URL, endpoint: '/jsonapi', auth: { clientId: 'b' } })
  })

  it('sets no auth for a Consumer alone, and never returns its secret', () => {
    const picked = clientOptions({ baseUrl: BASE_URL, consumer: { id: 'c', secret: 'shh', scope: 'read', password: 'p' } })
    expect(picked).not.toHaveProperty('auth')
    expect(picked).not.toHaveProperty('consumer')
    expect(JSON.stringify(picked)).not.toContain('shh')
  })

  it('gets no auth from a build-only config', () => {
    const { connections } = connectionsFrom({ baseUrl: BASE_URL, build: { auth: { clientId: 'b', clientSecret: 'shh' } } })
    expect(clientOptions(connections.default)).toEqual({ baseUrl: BASE_URL })
  })

  it('fills a missing clientId from the Consumer', () => {
    // A connection's browser may leave its clientId out, so this compiles with no cast.
    const connection: DruxtConnectionConfig = { baseUrl: BASE_URL, consumer: { id: 'c' }, browser: { scope: 'read', password: false, login: '/login', callback: '/callback' } }
    const picked = clientOptions(connection)
    expect(picked.auth).toEqual({ clientId: 'c', scope: 'read', password: false, login: '/login', callback: '/callback' })
    // The browser's own auth options keep it required.
    expectTypeOf<DruxtPublicAuthOptions['clientId']>().toEqualTypeOf<string>()
    expectTypeOf<NonNullable<DruxtConnectionConfig['browser']>['clientId']>().toEqualTypeOf<string | undefined>()
    const flat = clientOptions({ baseUrl: BASE_URL, auth: { scope: 'read' } as never, build: { auth: { clientId: 'b' } } })
    expect(flat.auth).toEqual({ scope: 'read', clientId: 'b' })
  })

  it('strips secrets from auth on the flat and connection paths', () => {
    const flat = clientOptions({ baseUrl: BASE_URL, auth: { clientId: 'a', clientSecret: 'shh', secret: 'shh2', password: 'shh3' } as never })
    expect(flat.auth).toEqual({ clientId: 'a' })
    const conn = clientOptions({ baseUrl: BASE_URL, browser: { clientId: 'a', secret: 'shh', password: true } as never })
    expect(conn.auth).toEqual({ clientId: 'a', password: true })
  })

  it('returns a deep copy of a connection', () => {
    const { connections } = connectionsFrom({ baseUrl: BASE_URL, endpoint: '/jsonapi', proxy: { api: true }, auth: { clientId: 'b' } })
    const picked = clientOptions(connections.default)
    picked.proxy!.api = false
    ;(picked.auth as { clientId: string }).clientId = 'changed'
    expect(connections.default.proxy).toEqual({ api: true })
    expect(connections.default.browser!.clientId).toBe('b')
  })

  it('keeps the logger and fetch by reference', () => {
    const logger = { info() {}, warn() {} }
    const fetch = async () => new Response('{}')
    const picked = clientOptions({ baseUrl: BASE_URL, logger, fetch, headers: { a: 'b' } })
    expect(picked.logger).toBe(logger)
    expect(picked.fetch).toBe(fetch)
    expect(picked.headers).toEqual({ a: 'b' })
  })

  it('leaves out connections', () => {
    const picked = clientOptions({ baseUrl: BASE_URL, connections: { shop: { baseUrl: 'x' } } })
    expect(Object.keys(picked)).toEqual(['baseUrl'])
  })
})

describe('mergeDeep', () => {
  it('merges nested objects, lets the newer value win, null included, takes arrays whole and changes neither input', () => {
    const target = { a: { b: 1, c: [1, 2] }, d: 'kept', e: { f: 1 } }
    const source = { a: { c: [3] }, e: null }
    const merged = mergeDeep(target, source)
    expect(merged).toEqual({ a: { b: 1, c: [3] }, d: 'kept', e: null })
    expect(target).toEqual({ a: { b: 1, c: [1, 2] }, d: 'kept', e: { f: 1 } })
    expect(source).toEqual({ a: { c: [3] }, e: null })
    expect(merged.a).not.toBe(target.a)
  })

  it('never writes a key the target only inherits', () => {
    const merged = mergeDeep({}, JSON.parse('{"__proto__": {"polluted": true}}') as object)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
  })

  it('never writes an own __proto__ of the target, as JSON.parse() makes one', () => {
    const target = JSON.parse('{"__proto__": {"polluted": true}, "kept": 1}') as object
    const merged = mergeDeep(target, { other: 2 })
    expect(merged).toEqual({ kept: 1, other: 2 })
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
    expect((merged as Record<string, unknown>).polluted).toBeUndefined()
    // Nor when the source carries one too.
    const both = mergeDeep(target, JSON.parse('{"__proto__": {"polluted": true}}') as object)
    expect(Object.getPrototypeOf(both)).toBe(Object.prototype)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('resolveDruxtSettings', () => {
  it('lets a later explicit undefined overwrite', () => {
    expect(resolveDruxtSettings({ siteUrl: 'a' }, { siteUrl: undefined })).toEqual({ siteUrl: undefined })
  })

  it('merges left to right, nesting objects and replacing arrays', () => {
    expect(resolveDruxtSettings(
      { router: { wildcard: true, x: [1] } },
      { router: { wildcard: false } },
      { router: { x: [2] } },
    )).toEqual({ router: { wildcard: false, x: [2] } })
  })

  it('skips undefined sources', () => {
    expect(resolveDruxtSettings(undefined, { siteUrl: 'a' }, undefined)).toEqual({ siteUrl: 'a' })
    expect(resolveDruxtSettings()).toEqual({})
  })

  it('does not change its sources', () => {
    const first = { router: { a: 1 } }
    resolveDruxtSettings(first, { router: { b: 2 } })
    expect(first).toEqual({ router: { a: 1 } })
  })

  it('does not pollute through __proto__', () => {
    const evil = JSON.parse('{"router":{"__proto__":{"polluted":true}},"__proto__":{"polluted":true}}')
    const out = resolveDruxtSettings({}, evil)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(out.polluted).toBeUndefined()
    expect((out.router as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('the client', () => {
  it('carries no settings property', () => {
    expect('settings' in new DruxtClient(BASE_URL, { router: { wildcard: true } })).toBe(false)
  })
})
