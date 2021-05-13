import DruxtNuxtModule from '..'

const options = {
  baseUrl: 'https://demo-api.druxtjs.org'
}

let mock

describe('DruxtJS Nuxt module', () => {
  beforeEach(() => {
    mock = {
      addModule: jest.fn(),
      addPlugin: jest.fn(),
      options: {
        buildDir: 'build',
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

  test('@nuxtjs/axios module', () => {
    mock.options.extendPlugins = jest.fn((o) => o)

    DruxtNuxtModule.call(mock)

    // Expect addModule to have been called to install @nuxtjs/axios.
    expect(mock.addModule).toHaveBeenCalledWith('@nuxtjs/axios')

    // Expect the Axios plugin to be the first in the list.
    const mockPlugins = [{ src: 'test' }, { src: 'build/axios.js' }]
    expect(typeof mock.options.extendPlugins).toBe('function')
    mock.options.extendPlugins(mockPlugins)
    expect(mockPlugins.shift()).toStrictEqual({ src: 'build/axios.js' })
  })
})
