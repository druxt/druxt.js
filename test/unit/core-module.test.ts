import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNuxt } from 'nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const loaded: Nuxt[] = []

/** Loads @druxt/core with these `druxt.auth` options, and returns the app and the auto-imports it registered. */
const load = async (auth?: Record<string, unknown>) => {
  const nuxt = await loadNuxt({
    cwd: join(root, 'test/unit/fixtures/core-module'),
    ready: true,
    overrides: { _prepare: true, ...(auth ? { druxt: { baseUrl: 'https://drupal.test', auth } } : {}) } as Record<string, unknown>,
  })
  loaded.push(nuxt)
  const imports: Array<{ name: string }> = []
  await nuxt.callHook('imports:extend', imports as never)
  const routes = nuxt.options.serverHandlers.map((handler) => handler.route)
  const publicAuth = (nuxt.options.runtimeConfig.public.druxt as { auth?: { password?: boolean } }).auth
  return { routes, imports: imports.map((entry) => entry.name), password: publicAuth?.password }
}

afterAll(async () => {
  for (const nuxt of loaded) await nuxt.close()
})

describe('the core module', () => {
  it('registers the password route for password: true with no secret at build', async () => {
    const { routes, password } = await load({ clientId: 'site', password: true })
    expect(password).toBe(true)
    expect(routes).toContain('/api/_druxt/auth/token')
  }, 120_000)

  it('registers nothing for password: false, even with a build secret', async () => {
    const { routes, password } = await load({ clientId: 'site', clientSecret: 'secret', password: false })
    expect(password).toBe(false)
    expect(routes).not.toContain('/api/_druxt/auth/token')
  }, 120_000)

  it('registers the token and logout routes for a session the server holds, whatever password says', async () => {
    for (const password of [true, false, undefined]) {
      const nuxt = await loadNuxt({
        cwd: join(root, 'test/unit/fixtures/core-module'),
        ready: true,
        overrides: { _prepare: true, druxt: { baseUrl: 'https://drupal.test', proxy: { api: true }, auth: { clientId: 'site', scope: 'editor', ...(password === undefined ? {} : { password }) } } } as Record<string, unknown>,
      })
      loaded.push(nuxt)
      const routes = nuxt.options.serverHandlers.map((handler) => handler.route)
      expect(routes, String(password)).toEqual(expect.arrayContaining(['/api/_druxt/auth/token', '/api/_druxt/auth/logout']))
      const auth = (nuxt.options.runtimeConfig.public.druxt as { auth?: { password?: boolean, session?: boolean } }).auth
      expect(auth, String(password)).toMatchObject({ session: true, password: password ?? false })
    }
  }, 120_000)

  it('derives the password grant from a build secret or a Consumer of its own when unset', async () => {
    expect((await load({ clientId: 'site' })).routes).not.toContain('/api/_druxt/auth/token')
    expect((await load({ clientId: 'site', passwordClientId: 'site-password' })).routes).toContain('/api/_druxt/auth/token')
  }, 120_000)
})

describe('the core module\'s browser sign-in', () => {
  // On Simple OAuth 6, a token holds the roles its scopes name and no others: with none, a signed-in editor reads less
  // than an anonymous visitor.
  it('warns at build with DRUXT_E01004 when browser sign-in names no scope, and not when it names one', async () => {
    const written: string[] = []
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => { written.push(String(chunk)); return true })
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => { written.push(String(chunk)); return true })
    try {
      await load({ clientId: 'site' })
      expect(written.filter((line) => line.includes('DRUXT_E01004'))).toHaveLength(1)
      expect(written.join('')).toContain('druxt.auth.scope')
      written.length = 0
      await load({ clientId: 'site', scope: 'editor' })
      await load()
      expect(written.join('')).not.toContain('DRUXT_E01004')
    } finally {
      stderr.mockRestore()
      stdout.mockRestore()
    }
  }, 120_000)
})

describe('the core module\'s cache options', () => {
  it('puts content and maxSize in the public config, and keeps the secret private', async () => {
    const nuxt = await loadNuxt({
      cwd: join(root, 'test/unit/fixtures/core-module'),
      ready: true,
      overrides: { _prepare: true, druxt: { baseUrl: 'https://drupal.test', cache: { content: true, maxSize: 1024, ttl: 60, secret: 'shared' } } } as Record<string, unknown>,
    })
    loaded.push(nuxt)
    expect((nuxt.options.runtimeConfig.public.druxt as { cache?: unknown }).cache).toEqual({ content: true, maxSize: 1024, ttl: 60 })
    expect((nuxt.options.runtimeConfig.druxt as { cache?: { secret?: string } }).cache?.secret).toBe('shared')
  }, 120_000)

  it('gives the proxy the session cookie pattern in development, where the cache is off', async () => {
    const nuxt = await loadNuxt({
      cwd: join(root, 'test/unit/fixtures/core-module'),
      dev: true,
      ready: true,
      overrides: { _prepare: true, druxt: { baseUrl: 'https://drupal.test', cache: { sessionCookie: 'site_session' } } } as Record<string, unknown>,
    })
    loaded.push(nuxt)
    expect((nuxt.options.runtimeConfig.public.druxt as { cache?: unknown }).cache).toBe(false)
    expect((nuxt.options.runtimeConfig.druxt as { proxy?: { sessionCookie?: string } }).proxy?.sessionCookie).toBe('site_session')
  }, 120_000)
})

describe('the core module\'s own routes', () => {
  const loadWith = async (druxt: Record<string, unknown>) => {
    const nuxt = await loadNuxt({
      cwd: join(root, 'test/unit/fixtures/core-module'),
      ready: true,
      overrides: { _prepare: true, druxt: { baseUrl: 'https://drupal.test', ...druxt } } as Record<string, unknown>,
    })
    loaded.push(nuxt)
    return nuxt.options.serverHandlers.map((handler) => handler.route)
  }

  it('registers them under /api/_druxt, beside a proxy for a JSON:API Drupal serves at /api', async () => {
    const routes = await loadWith({ endpoint: '/api', proxy: { api: true }, cache: { secret: 'shared' }, auth: { clientId: 'site', scope: 'editor' } })
    expect(routes).toEqual(expect.arrayContaining(['/api/_druxt/cache/clear', '/api/_druxt/auth/token', '/api/_druxt/auth/logout', '/api', '/api/**']))
    expect(routes.filter((route) => route?.startsWith('/_druxt'))).toEqual([])
  }, 120_000)

  it('proxies one path for an endpoint however it is written, and gives the app that spelling', async () => {
    for (const [endpoint, served] of [['/jsonapi/', '/jsonapi'], ['jsonapi', '/jsonapi'], ['api', '/api'], [undefined, '/jsonapi']] as const) {
      const nuxt = await loadNuxt({
        cwd: join(root, 'test/unit/fixtures/core-module'),
        ready: true,
        overrides: { _prepare: true, druxt: { baseUrl: 'https://drupal.test', proxy: { api: true }, ...(endpoint ? { endpoint } : {}) } } as Record<string, unknown>,
      })
      loaded.push(nuxt)
      const routes = nuxt.options.serverHandlers.map((handler) => handler.route)
      expect(routes, String(endpoint)).toEqual(expect.arrayContaining([served, `${served}/**`]))
      expect(routes.filter((route) => route?.includes('//')), String(endpoint)).toEqual([])
      expect((nuxt.options.runtimeConfig.public.druxt as { endpoint?: string }).endpoint, String(endpoint)).toBe(served)
    }
  }, 120_000)

  it('fails the build with DRUXT_E01006 for a JSON:API endpoint at or under /api/_druxt', async () => {
    for (const endpoint of ['/api/_druxt', 'api/_druxt/', '/api/_druxt/jsonapi']) {
      await expect(loadWith({ endpoint, proxy: { api: true } }), endpoint).rejects.toThrow(/DRUXT_E01006: Drupal's JSON:API is at \/api\/_druxt/)
    }
  }, 120_000)
})

describe('the core module\'s proxy, when the site\'s languages cannot be read', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  // Drupal lists its languages to a visitor, and refuses the build's credentials, so the build cannot read them.
  const refusing = () => {
    vi.stubEnv('DRUXT_BUILD_CLIENT_ID', 'build')
    vi.stubEnv('DRUXT_BUILD_CLIENT_SECRET', 'wrong-secret')
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/vnd.api+json', 'content-language': 'en' } })
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname
      if (path === '/oauth/token') return reply({ error: 'invalid_client', message: 'Client authentication failed' }, 401)
      if (path === '/jsonapi') {
        return reply({ links: { 'self': { href: 'https://drupal.test/jsonapi' }, 'configurable_language--configurable_language': { href: 'https://drupal.test/jsonapi/configurable_language/configurable_language' } } })
      }
      return reply({}, 404)
    }))
  }

  it('warns once in development, naming the prefixed paths it loses, and proxies only the unprefixed endpoint', async () => {
    refusing()
    const written: string[] = []
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => { written.push(String(chunk)); return true })
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => { written.push(String(chunk)); return true })
    try {
      const nuxt = await loadNuxt({
        cwd: join(root, 'test/unit/fixtures/core-module'),
        ready: true,
        dev: true,
        overrides: { druxt: { baseUrl: 'https://drupal.test', proxy: { api: true } } } as Record<string, unknown>,
      })
      loaded.push(nuxt)
      const proxied = (nuxt.options as unknown as { _druxtProxy?: string[] })._druxtProxy || []
      expect(proxied.filter((path) => path.endsWith('/jsonapi/**'))).toEqual(['/jsonapi/**'])
      // The app's languages, from the same read: none, with no second warning.
      const template = nuxt.options.build.templates.find((entry) => entry.filename === 'druxt/languages.mjs')!
      const contents = await (template.getContents as (data: unknown) => Promise<string>)({ nuxt, app: {}, options: {} })
      expect(contents).toBe('export const languages = []\n')
      const warnings = written.filter((line) => line.includes('languages could not be read'))
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('language-prefixed')
      expect(warnings[0]).toContain('/jsonapi')
    } finally {
      stderr.mockRestore()
      stdout.mockRestore()
    }
  }, 120_000)

  it('stops a production build Drupal refused, naming what the site would lose and what to check', async () => {
    refusing()
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    try {
      const load = loadNuxt({
        cwd: join(root, 'test/unit/fixtures/core-module'),
        ready: true,
        overrides: { druxt: { baseUrl: 'https://drupal.test', proxy: { api: true } } } as Record<string, unknown>,
      })
      load.then((nuxt) => loaded.push(nuxt), () => {})
      await expect(load).rejects.toThrow(/DRUXT_E01008: Drupal at https:\/\/drupal\.test refused the read of the site's languages, so the build stops/)
    } finally {
      stderr.mockRestore()
      stdout.mockRestore()
    }
  }, 120_000)

  // A build with no way to Drupal, as in a container, is not a mistake in the site: it builds, and says what it lacks.
  it('builds in production with a warning when Drupal gives no answer', async () => {
    // With build credentials, so the build signs in before it reads, and that request is the one with no answer.
    vi.stubEnv('DRUXT_BUILD_CLIENT_ID', 'build')
    vi.stubEnv('DRUXT_BUILD_CLIENT_SECRET', 'secret')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    const written: string[] = []
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: string | Uint8Array) => { written.push(String(chunk)); return true })
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => { written.push(String(chunk)); return true })
    try {
      const nuxt = await loadNuxt({
        cwd: join(root, 'test/unit/fixtures/core-module'),
        ready: true,
        overrides: { druxt: { baseUrl: 'https://drupal.test', proxy: { api: true } } } as Record<string, unknown>,
      })
      loaded.push(nuxt)
      const proxied = (nuxt.options as unknown as { _druxtProxy?: string[] })._druxtProxy || []
      expect(proxied.filter((path) => path.endsWith('/jsonapi/**'))).toEqual(['/jsonapi/**'])
      expect(written.filter((line) => line.includes('languages could not be read'))).toHaveLength(1)
      expect(written.some((line) => line.includes('DRUXT_E01008'))).toBe(false)
    } finally {
      stderr.mockRestore()
      stdout.mockRestore()
    }
  }, 120_000)
})
