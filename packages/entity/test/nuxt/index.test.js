import DruxtEntityNuxtModule from '../../src/nuxt'

// jest.mock('../src/nuxtStorybook')

jest.mock('@nuxt/kit', () => ({
  defineNuxtModule: (module) => module,
  installModule: jest.fn(),
}))

const nuxtMock = {
  hook: jest.fn((hook, fn) => {
    const arg = {
      'components:dirs': [],
      'storybook:config': { stories: [] }
    }
    return fn(arg[hook])
  }),
}

test('Nuxt module', async () => {
  nuxtMock.options = {
    druxt: {},
    modules: [],
  }
  await DruxtEntityNuxtModule.setup({}, nuxtMock)
})
