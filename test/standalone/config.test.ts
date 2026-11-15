import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { DRUXT_CLIENT_KEYS } from '@druxt/client'

// Keys that are not settings, which neither settings function may return.
const NOT_SETTINGS = [...DRUXT_CLIENT_KEYS, 'build', 'connections', 'clientSecret', 'secret']

// Every secret, as the config and the environment give it: none may reach the page.
const SECRETS = [
  'auth-secret-from-config', 'cache-secret-from-config', 'build-secret-from-config',
  'auth-secret-from-env', 'cache-secret-from-env', 'build-secret-from-env', 'build-password-from-env',
]

/**
 * The config split: each secret's environment variable lands on its private
 * path at runtime, the public config and the payload hold no secret, and the
 * two tiers of settings from Drupal reach where each belongs.
 */
describe('the druxt config, split', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/config', import.meta.url)),
    build: true,
    server: true,
    setupTimeout: 300_000,
    env: {
      NUXT_DRUXT_AUTH_CLIENT_SECRET: 'auth-secret-from-env',
      NUXT_DRUXT_CACHE_SECRET: 'cache-secret-from-env',
      NUXT_DRUXT_BUILD_AUTH_CLIENT_ID: 'build-from-env',
      NUXT_DRUXT_BUILD_AUTH_CLIENT_SECRET: 'build-secret-from-env',
      NUXT_DRUXT_BUILD_AUTH_USERNAME: 'build-user-from-env',
      NUXT_DRUXT_BUILD_AUTH_PASSWORD: 'build-password-from-env',
      NUXT_PUBLIC_DRUXT_SITE_URL: 'https://site-url-from-env.test',
      NUXT_DRUXT_PROXY_TRUST_FORWARDED: 'true',
    },
  })

  it('lands each secret\'s environment variable on its private path', async () => {
    const { private: config } = await $fetch<{ private: Record<string, unknown> }>('/api/settings')
    expect(config).toEqual({
      auth: { clientSecret: 'auth-secret-from-env' },
      cache: { secret: 'cache-secret-from-env' },
      proxy: { trustForwarded: true, sessionCookie: '' },
      build: { auth: { clientId: 'build-from-env', clientSecret: 'build-secret-from-env', username: 'build-user-from-env', password: 'build-password-from-env', scope: 'druxt_build' } },
    })
  })

  it('checks the cache-clear secret from the environment', async () => {
    const clear = (secret: string) => fetch('/api/_druxt/cache/clear', { method: 'POST', headers: { 'X-Druxt-Secret': secret } })
    expect((await clear('cache-secret-from-config')).status).toBe(401)
    expect((await clear('cache-secret-from-env')).status).toBe(204)
  })

  it('sets siteUrl from NUXT_PUBLIC_DRUXT_SITE_URL, over Drupal\'s', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('<dd id="site-url">https://site-url-from-env.test</dd>')
  })

  it('renders the public tier stored at server start, and carries it in the payload for hydration', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('<dd id="from-drupal">public-from-drupal</dd>')
    const payload = html.slice(html.indexOf('id="__NUXT_DATA__"'))
    expect(payload).toContain('druxt:settings:drupal:default')
    expect(payload).toContain('public-from-drupal')
  })

  it('renders a public tier set during the render, merged over the stored one', async () => {
    const html = await $fetch<string>('/render')
    expect(html).toContain('<dd id="from-render">public-from-render</dd>')
    expect(html).toContain('<dd id="from-drupal">public-from-drupal</dd>')
  })

  it('renders a public tier set during the render with replace, in place of the stored one', async () => {
    const html = await $fetch<string>('/render-replace')
    expect(html).toContain('<dd id="from-render">public-from-render</dd>')
    expect(html).toContain('<dd id="from-drupal"></dd>')
  })

  it('keeps the server tier and every secret out of the page and its payload', async () => {
    for (const path of ['/', '/render', '/render-replace']) {
      const html = await $fetch<string>(path)
      expect(html).toContain('<dd id="server-only">absent</dd>')
      for (const value of ['server-only-from-drupal', 'server-only-from-render', ...SECRETS]) expect(html).not.toContain(value)
      expect(html).not.toContain('clientSecret')
    }
  })

  it('reads the server tier from useDruxtServerSettings() in a server route', async () => {
    const { settings } = await $fetch<{ settings: Record<string, unknown> }>('/api/settings')
    expect(settings).toMatchObject({
      fromDrupal: 'public-from-drupal',
      serverOnly: 'server-only-from-drupal',
      siteUrl: 'https://site-url-from-env.test',
    })
  })

  it('returns no client option and no secret from either settings function', async () => {
    const { settings } = await $fetch<{ settings: Record<string, unknown> }>('/api/settings')
    for (const key of NOT_SETTINGS) expect(Object.keys(settings)).not.toContain(key)
    for (const value of SECRETS) expect(JSON.stringify(settings)).not.toContain(value)
    const html = await $fetch<string>('/')
    const keys = html.match(/<dd id="keys">([^<]*)<\/dd>/)![1]!.split(',')
    expect(keys).toContain('fromDrupal')
    for (const key of NOT_SETTINGS) expect(keys).not.toContain(key)
  })

  it('renders a tier set later in the render, for a component that read its settings first, and carries it for hydration', async () => {
    const html = await $fetch<string>('/late')
    expect(html).toContain('<p id="late">set-after-read</p>')
    expect(html.slice(html.indexOf('id="__NUXT_DATA__"'))).toContain('set-after-read')
  })
})
