import DruxtBreadcrumbModule from '../../src/nuxt'

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
    buildDir: 'build',
    druxt: {}
  }
  await DruxtBreadcrumbModule.setup({}, nuxtMock)
})
