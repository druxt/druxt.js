import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNuxt } from 'nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import { afterAll, describe, expect, it, vi } from 'vitest'

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
