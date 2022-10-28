/* global beforeEach, describe, expect, jest, test */

import DruxtNuxtModule from '../../src'

const options = {
  baseUrl: 'https://api.umami.demo.druxtjs.org',
  endpoint: '/jsonapi',
}

let mock

describe('DruxtJS Nuxt module', () => {
  beforeEach(() => {
    mock = {
      addModule: jest.fn(),
      addPlugin: jest.fn(),
      addServerMiddleware: jest.fn(),
      addTemplate: jest.fn(),
      nuxt: {
        hook: jest.fn((hook, fn) => {
          const arg = {
            'components:dirs': [],
            'storybook:config': { stories: [] }
          }
          return fn(arg[hook])
        }),
      },
      options: {
        buildDir: 'build',
        druxt: options,
        cli: {
          badgeMessages: [],
        }
      },
      DruxtNuxtModule
    }
  })

  test('Module options', () => {
    // Call Druxt module with module options.
    DruxtNuxtModule.call(mock, options)

    // Expect addPlugin to have been called with options.
    expect(mock.addPlugin).toHaveBeenCalledWith(expect.objectContaining({ options }))
  })

  test('Root options', () => {
    // Set root options.
    mock.options.druxt = options

    // Call Druxt module.
    DruxtNuxtModule.call(mock)

    // Expect addPlugin to have been called with options.
    expect(mock.addPlugin).toHaveBeenCalledWith(expect.objectContaining({ options }))
  })

  test('Default options', async () => {
    // Expect:
    // - Components enabled.
    // - Vuex store enabled.
    await DruxtNuxtModule.call(mock)
    expect(mock.options.components).toBe(true)
    expect(mock.options.store).toBe(true)

    // Expect:
    // - Components disbaled.
    mock.options.components = false
    await DruxtNuxtModule.call(mock)
    expect(mock.options.components).toBe(false)
  })

  test('Plugin order', async () => {
    // Expect:
    // - extendPlugins to be a function.
    await DruxtNuxtModule.call(mock)
    expect(typeof mock.options.extendPlugins).toBe('function')

    // Expect:
    // - The plugins should have the $druxt plugin first.
    const plugins = [
      { src: `${mock.options.buildDir}/foobar.js` },
      { src: `${mock.options.buildDir}/druxt.js` },
      { src: `${mock.options.buildDir}/axios.js` }
    ]
    let sorted = mock.options.extendPlugins(plugins)
    expect(sorted[0].src).toBe(`${mock.options.buildDir}/axios.js`)
    expect(sorted[1].src).toBe(`${mock.options.buildDir}/druxt.js`)
  })

  test('@nuxtjs/axios module', async () => {
    mock.options.extendPlugins = jest.fn((o) => o)

    await DruxtNuxtModule.call(mock)

    // Expect addModule to have been called to install @nuxtjs/axios.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/axios')
  })

  test('API Proxy', async () => {
    // Enable API Proxy.
    mock.options.druxt = {
      ...options,
      proxy: {
        api: true,
      }
    }
    await DruxtNuxtModule.call(mock)

    // Ensure Nuxt proxy is enabled.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/proxy')
    // Ensure proxies are set.
    expect(mock.options.proxy).toStrictEqual({
      [`/en${options.endpoint}`]: options.baseUrl,
      [`/es${options.endpoint}`]: options.baseUrl,
      [options.endpoint]: options.baseUrl,
      '/router/translate-path': options.baseUrl
    })
  })

  test('File Proxy', async () => {
    // Enable File proxy.
    mock.options.druxt = {
      ...options,
      proxy: {
        files: true,
      }
    }
    await DruxtNuxtModule.call(mock)

    expect(mock.options.proxy).toStrictEqual({
      '/sites/default/files': options.baseUrl
    })

    // Use custom files directory.
    delete mock.options.proxy
    mock.options.druxt.proxy.files = 'druxtjs.org'
    await DruxtNuxtModule.call(mock)

    expect(mock.options.proxy).toStrictEqual({
      '/sites/druxtjs.org/files': options.baseUrl
    })
  })

  test('Proxy - merge options', async () => {
    // Enable API Proxy.
    mock.options.druxt = {
      ...options,
      proxy: {
        api: true,
      }
    }

    // Set array proxy settings.
    mock.options.proxy = [`${options.baseUrl}/array-test`]

    await DruxtNuxtModule.call(mock)

    // Ensure Nuxt proxy is enabled.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/proxy')
    // Ensure proxies are set.
    expect(mock.options.proxy).toStrictEqual([
      `${options.baseUrl}/array-test`,
      `${options.baseUrl}${options.endpoint}`,
      `${options.baseUrl}/en${options.endpoint}`,
      `${options.baseUrl}/es${options.endpoint}`,
      `${options.baseUrl}/router/translate-path`,
    ])

    // Set object proxy settings.
    mock.options.proxy = { '/object-test': options.baseUrl }

    await DruxtNuxtModule.call(mock)

    // Ensure Nuxt proxy is enabled.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/proxy')
    // Ensure proxies are set.
    expect(mock.options.proxy).toStrictEqual({
      '/object-test': options.baseUrl,
      [`/en${options.endpoint}`]: options.baseUrl,
      [`/es${options.endpoint}`]: options.baseUrl,
      [options.endpoint]: options.baseUrl,
      '/router/translate-path': options.baseUrl
    })
  })

  test('Devel - Server middleware', () => {
    // Enable development mode.
    mock.options.dev = true
    DruxtNuxtModule.call(mock)
    expect(mock.addServerMiddleware).toHaveBeenCalledWith({
      handler: 'druxt/dist/server-middleware/template.mjs',
      path: '/_druxt/template'
    })
  })
})
