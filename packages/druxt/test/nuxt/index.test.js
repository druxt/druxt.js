/* global beforeEach, describe, expect, jest, test */

import DruxtNuxtModule from '../../src/nuxt'

jest.mock('@nuxt/kit', () => ({
  addPluginTemplate: jest.fn(),
  defineNuxtModule: (module) => module,
  installModule: jest.fn(),
}))

import { addPluginTemplate, installModule } from '@nuxt/kit'

const options = {
  baseUrl: 'https://api.umami.demo.druxtjs.org',
  endpoint: '/jsonapi',
}

let nuxtMock

describe('DruxtJS Nuxt module', () => {
  beforeEach(() => {
    nuxtMock = {
      hook: jest.fn((hook, fn) => {
        const arg = {
          'components:dirs': [],
          'storybook:config': { stories: [] }
        }
        return fn(arg[hook])
      }),
      options: {
        buildDir: 'build',
        druxt: options,
        cli: {
          badgeMessages: [],
        }
      },
    }
  })

  test('Module options', async () => {
    // Call Druxt module with module options.
    await DruxtNuxtModule.setup(options, nuxtMock)

    // Expect addPlugin to have been called with options.
    expect(addPluginTemplate).toHaveBeenCalledWith(expect.objectContaining({ options }))

    // Ensure that Druxt and Axios plugins are correctly ordered.
    const mockPlugins = [{ src: `${nuxtMock.options.buildDir}/druxt.js` }, { src: `${nuxtMock.options.buildDir}/axios.js` }]
    expect(nuxtMock.options.extendPlugins(mockPlugins)[0].src).toEqual(`${nuxtMock.options.buildDir}/axios.js`)
  })

  test('Root options', async () => {
    // Set root options.
    nuxtMock.options.druxt = options

    // Call Druxt module.
    await DruxtNuxtModule.setup({}, nuxtMock)

    // Expect addPlugin to have been called with options.
    expect(addPluginTemplate).toHaveBeenCalledWith(expect.objectContaining({ options }))
  })

  test('Default options', async () => {
    // Expect:
    // - Components enabled.
    // - Vuex store enabled.
    await DruxtNuxtModule.setup({}, nuxtMock)
    expect(nuxtMock.options.components).toBe(true)
    expect(nuxtMock.options.store).toBe(true)

    // Expect:
    // - Components disbaled.
    nuxtMock.options.components = false
    await DruxtNuxtModule.setup({}, nuxtMock)
    expect(nuxtMock.options.components).toBe(false)
  })

  test('Plugin order', async () => {
    // Expect:
    // - extendPlugins to be a function.
    await DruxtNuxtModule.setup({}, nuxtMock)
    expect(typeof nuxtMock.options.extendPlugins).toBe('function')

    // Expect:
    // - The plugins should have the $druxt plugin first.
    const plugins = [
      { src: `${nuxtMock.options.buildDir}/foobar.js` },
      { src: `${nuxtMock.options.buildDir}/druxt.js` },
      { src: `${nuxtMock.options.buildDir}/axios.js` }
    ]
    let sorted = nuxtMock.options.extendPlugins(plugins)
    expect(sorted[0].src).toBe(`${nuxtMock.options.buildDir}/axios.js`)
    expect(sorted[1].src).toBe(`${nuxtMock.options.buildDir}/druxt.js`)
  })

  test('@nuxtjs/axios module', async () => {
    nuxtMock.options.extendPlugins = jest.fn((o) => o)

    await DruxtNuxtModule.setup({}, nuxtMock)

    // Expect installModule to have been called to install @nuxtjs/axios.
    expect(installModule).toHaveBeenCalledWith('@nuxtjs/axios', expect.any(Object), expect.any(Object))
  })

  test('API Proxy', async () => {
    // Enable API Proxy.
    nuxtMock.options.druxt = {
      ...options,
      proxy: {
        api: true,
      }
    }
    await DruxtNuxtModule.setup({}, nuxtMock)

    // Ensure Nuxt proxy is enabled.
    expect(installModule).toHaveBeenCalledWith('@nuxtjs/proxy', expect.any(Object), expect.any(Object))
    // Ensure proxies are set.
    expect(nuxtMock.options.proxy).toStrictEqual({
      [`/en${options.endpoint}`]: options.baseUrl,
      [`/es${options.endpoint}`]: options.baseUrl,
      [options.endpoint]: options.baseUrl,
      '/router/translate-path': options.baseUrl
    })
  })

  test('File Proxy', async () => {
    // Enable File proxy.
    nuxtMock.options.druxt = {
      ...options,
      proxy: {
        files: true,
      }
    }
    await DruxtNuxtModule.setup({}, nuxtMock)

    expect(nuxtMock.options.proxy).toStrictEqual({
      '/sites/default/files': options.baseUrl
    })

    // Use custom files directory.
    delete nuxtMock.options.proxy
    nuxtMock.options.druxt.proxy.files = 'druxtjs.org'
    await DruxtNuxtModule.setup({}, nuxtMock)

    expect(nuxtMock.options.proxy).toStrictEqual({
      '/sites/druxtjs.org/files': options.baseUrl
    })
  })

  test('Proxy - merge options', async () => {
    // Enable API Proxy.
    nuxtMock.options.druxt = {
      ...options,
      proxy: {
        api: true,
      }
    }

    // Set array proxy settings.
    nuxtMock.options.proxy = [`${options.baseUrl}/array-test`]

    await DruxtNuxtModule.setup({}, nuxtMock)

    // Ensure Nuxt proxy is enabled.
    expect(installModule).toHaveBeenCalledWith('@nuxtjs/proxy', expect.any(Object), expect.any(Object))
    // Ensure proxies are set.
    expect(nuxtMock.options.proxy).toStrictEqual([
      `${options.baseUrl}/array-test`,
      `${options.baseUrl}${options.endpoint}`,
      `${options.baseUrl}/en${options.endpoint}`,
      `${options.baseUrl}/es${options.endpoint}`,
      `${options.baseUrl}/router/translate-path`,
    ])

    // Set object proxy settings.
    nuxtMock.options.proxy = { '/object-test': options.baseUrl }

    await DruxtNuxtModule.setup({}, nuxtMock)

    // Ensure Nuxt proxy is enabled.
    expect(installModule).toHaveBeenCalledWith('@nuxtjs/proxy', expect.any(Object), expect.any(Object))
    // Ensure proxies are set.
    expect(nuxtMock.options.proxy).toStrictEqual({
      '/object-test': options.baseUrl,
      [`/en${options.endpoint}`]: options.baseUrl,
      [`/es${options.endpoint}`]: options.baseUrl,
      [options.endpoint]: options.baseUrl,
      '/router/translate-path': options.baseUrl
    })
  })

  // @TODO - Reimplement the development server middleware.
  // test('Devel - Server middleware', () => {
  //   // Enable development mode.
  //   nuxtMock.options.dev = true
  //   DruxtNuxtModule.setup({}, nuxtMock)
  //   expect(nuxtMock.addServerMiddleware).toHaveBeenCalledWith({
  //     handler: 'druxt/dist/server-middleware/template.mjs',
  //     path: '/_druxt/template'
  //   })
  // })
})
