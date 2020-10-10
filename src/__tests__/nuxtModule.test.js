import DruxtNuxtModule from '..'

const options = {
  baseUrl: 'https://demo-api.druxtjs.org'
}

let mock

describe('DruxtJS Nuxt module', () => {
  beforeEach(() => {
    mock = {
      addPlugin: jest.fn(),
      DruxtNuxtModule
    }
  })

  test('Module options', () => {
    // Call Druxt module with module options.
    mock.DruxtNuxtModule(options)

    // Expect addPlugin to have been called with options.
    expect(mock.addPlugin).toHaveBeenCalledWith(expect.objectContaining({ options }))
  })

  test('Root options', () => {
    // Set root options.
    mock.options = { druxt: options }

    // Call Druxt module.
    mock.DruxtNuxtModule()

    // Expect addPlugin to have been called with options.
    expect(mock.addPlugin).toHaveBeenCalledWith(expect.objectContaining({ options }))
  })
})
