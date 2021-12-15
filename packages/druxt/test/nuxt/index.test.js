import DruxtNuxtModule from '../../src'

const options = {
  baseUrl: 'https://demo-api.druxtjs.org',
  endpoint: '/jsonapi',
}

let mock

describe('DruxtJS Nuxt module', () => {
  beforeEach(() => {
    mock = {
      addModule: jest.fn(),
      addPlugin: jest.fn(),
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

  test('Default options', () => {
    // Expect:
    // - Components enabled.
    // - Vuex store enabled.
    DruxtNuxtModule.call(mock)
    expect(mock.options.components).toBe(true)
    expect(mock.options.store).toBe(true)

    // Expect:
    // - Components disbaled.
    mock.options.components = false
    DruxtNuxtModule.call(mock)
    expect(mock.options.components).toBe(false)
  })

  test('Plugin order', () => {
    mock.options.buildDir = '.nuxt'

    // Expect:
    // - extendPlugins to be a function.
    DruxtNuxtModule.call(mock)
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

  test('API Proxy', () => {
    // Enable API Proxy.
    mock.options.druxt = {
      ...options,
      proxy: {
        api: true,
      }
    }
    DruxtNuxtModule.call(mock)

    // Ensure Nuxt proxy is enabled.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/proxy')
    // Ensure proxies are set.
    expect(mock.options.proxy).toStrictEqual({
      [options.endpoint]: options.baseUrl,
      '/router/translate-path': options.baseUrl
    })
  })

  test('File Proxy', () => {
    // Enable File proxy.
    mock.options.druxt = {
      ...options,
      proxy: {
        files: true,
      }
    }
    DruxtNuxtModule.call(mock)

    expect(mock.options.proxy).toStrictEqual({
      '/sites/default/files': options.baseUrl
    })

    // Use custom files directory.
    delete mock.options.proxy
    mock.options.druxt.proxy.files = 'druxtjs.org'
    DruxtNuxtModule.call(mock)

    expect(mock.options.proxy).toStrictEqual({
      '/sites/druxtjs.org/files': options.baseUrl
    })
  })

  test('Proxy - merge options', () => {
    // Enable API Proxy.
    mock.options.druxt = {
      ...options,
      proxy: {
        api: true,
      }
    }

    // Set array proxy settings.
    mock.options.proxy = [`${options.baseUrl}/array-test`]

    DruxtNuxtModule.call(mock)

    // Ensure Nuxt proxy is enabled.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/proxy')
    // Ensure proxies are set.
    expect(mock.options.proxy).toStrictEqual([
      `${options.baseUrl}${options.endpoint}`,
      `${options.baseUrl}/router/translate-path`,
      `${options.baseUrl}/array-test`,
    ])

    // Set object proxy settings.
    mock.options.proxy = { '/object-test': options.baseUrl }

    DruxtNuxtModule.call(mock)

    // Ensure Nuxt proxy is enabled.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/proxy')
    // Ensure proxies are set.
    expect(mock.options.proxy).toStrictEqual({
      [options.endpoint]: options.baseUrl,
      '/object-test': options.baseUrl,
      '/router/translate-path': options.baseUrl
    })
  })
})
