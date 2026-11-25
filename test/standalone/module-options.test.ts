import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadNuxt, logger } from 'nuxt/kit'

// Each test sets the app up, as `nuxt prepare` does, without building it.

/**
 * A named connection other than `default` is reserved for a later release:
 * the module warns once, when the app is set up, and ignores it.
 */
describe('druxt.connections', () => {
  it('warns once about a name other than default, through the module\'s logger', async () => {
    const logs: string[] = []
    // useLogger() tags Nuxt kit's logger, and the tagged loggers share its reporters.
    const reporter = { log: (log: { tag?: string, type: string, args: unknown[] }) => { logs.push(`${log.type} ${log.tag} ${log.args.join(' ')}`) } }
    logger.addReporter(reporter)
    try {
      const nuxt = await loadNuxt({
        cwd: fileURLToPath(new URL('./fixtures/ssr', import.meta.url)),
        ready: true,
        overrides: {
          _prepare: true,
          druxt: { baseUrl: 'https://drupal.invalid', connections: { default: { baseUrl: 'https://drupal.invalid' }, shop: { baseUrl: 'https://shop.invalid' } } },
        },
      })
      await nuxt.close()
    } finally {
      logger.removeReporter(reporter)
    }
    const shop = logs.filter((line) => line.includes('connections.shop'))
    expect(shop).toHaveLength(1)
    expect(shop[0]).toMatch(/^warn @druxt\/core .*`druxt\.connections\.shop` is ignored/)
    // The default connection is the flat keys: an entry for it warns once, with its own wording.
    const own = logs.filter((line) => line.includes('connections.default'))
    expect(own).toHaveLength(1)
    expect(own[0]).toMatch(/use the flat `druxt` keys/)
  })
})

/** An unknown `develMessages`, such as the removed `'indicator'`, warns once, naming the valid values. */
describe('druxt.develMessages', () => {
  const warnings = async (develMessages: unknown): Promise<string[]> => {
    const logs: string[] = []
    const reporter = { log: (log: { tag?: string, type: string, args: unknown[] }) => { logs.push(`${log.type} ${log.tag} ${log.args.join(' ')}`) } }
    logger.addReporter(reporter)
    try {
      const nuxt = await loadNuxt({
        cwd: fileURLToPath(new URL('./fixtures/ssr', import.meta.url)),
        ready: true,
        // Cast, since an invalid value is what the test passes.
        overrides: { _prepare: true, druxt: { baseUrl: 'https://drupal.invalid', develMessages: develMessages as 'devtools' } },
      })
      await nuxt.close()
    } finally {
      logger.removeReporter(reporter)
    }
    return logs.filter((line) => line.includes('develMessages'))
  }

  it('warns once about an unknown value, naming the valid ones', async () => {
    const found = await warnings('indicator')
    expect(found).toHaveLength(1)
    expect(found[0]).toMatch(/^warn @druxt\/core .*`druxt\.develMessages` is "indicator".*'devtools' or 'inline'/)
  })

  it('says nothing about a valid value', async () => {
    expect(await warnings('inline')).toEqual([])
    expect(await warnings('devtools')).toEqual([])
  })
})

describe('the druxt options other modules read', () => {
  it('lose the auth and cache secrets, and keep the build credentials', async () => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('./fixtures/ssr', import.meta.url)),
      ready: true,
      overrides: {
        _prepare: true,
        druxt: {
          baseUrl: 'https://drupal.invalid',
          auth: { clientId: 'site', clientSecret: 'auth-secret' },
          cache: { ttl: 60, secret: 'cache-secret' },
          build: { auth: { clientId: 'build', clientSecret: 'build-secret' } },
        },
      },
    })
    const druxt = (nuxt.options as unknown as { druxt: Record<string, Record<string, unknown>> }).druxt
    const privateConfig = nuxt.options.runtimeConfig.druxt
    await nuxt.close()
    expect(druxt.auth).toEqual({ clientId: 'site' })
    expect(druxt.cache).toEqual({ ttl: 60 })
    expect(druxt.build).toEqual({ auth: { clientId: 'build', clientSecret: 'build-secret' } })
    expect(privateConfig).toMatchObject({ auth: { clientSecret: 'auth-secret' }, cache: { secret: 'cache-secret' } })
  })

  it('lose the credentials of an ignored named connection', async () => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('./fixtures/ssr', import.meta.url)),
      ready: true,
      overrides: {
        _prepare: true,
        druxt: {
          baseUrl: 'https://drupal.invalid',
          connections: {
            shop: {
              baseUrl: 'https://shop.invalid',
              consumer: { id: 'shop', secret: 'consumer-secret', username: 'editor', password: 'consumer-password' },
              browser: { clientId: 'shop-browser', secret: 'browser-secret', password: false, login: '/login', callback: '/callback' },
            },
          },
        },
      },
    })
    const druxt = (nuxt.options as unknown as { druxt: { connections: Record<string, Record<string, Record<string, unknown>>> } }).druxt
    await nuxt.close()
    expect(druxt.connections.shop!.consumer).toEqual({ id: 'shop', username: 'editor' })
    expect(druxt.connections.shop!.browser).toEqual({ clientId: 'shop-browser', password: false, login: '/login', callback: '/callback' })
  })

  it('lose the credentials of connections.default, which is not read', async () => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('./fixtures/ssr', import.meta.url)),
      ready: true,
      overrides: {
        _prepare: true,
        druxt: {
          baseUrl: 'https://drupal.invalid',
          connections: { default: { baseUrl: 'https://drupal.invalid', consumer: { id: 'x', secret: 'consumer-secret', password: 'consumer-password' } } },
        },
      },
    })
    const druxt = (nuxt.options as unknown as { druxt: { connections: Record<string, Record<string, Record<string, unknown>>> } }).druxt
    await nuxt.close()
    expect(druxt.connections.default!.consumer).toEqual({ id: 'x' })
  })
})
