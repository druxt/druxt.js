import DruxtRouterNuxtModule from '../../src/nuxt'

jest.mock('@nuxt/kit', () => ({
  addPluginTemplate: jest.fn(),
  addTemplate: jest.fn(),
  defineNuxtModule: (module) => module,
  extendPages: jest.fn(),
  installModule: jest.fn(),
}))

import { addPluginTemplate, addTemplate, extendPages, installModule } from '@nuxt/kit'

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
    build: {},
    buildDir: '',
    dir: { pages: 'pages' },
    druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
    srcDir: __dirname,
  }

  nuxtMock.options.druxt.router = { pages: true }
  await DruxtRouterNuxtModule.setup({}, nuxtMock)
  expect(addPluginTemplate).toHaveBeenCalledTimes(2)
  expect(addTemplate).toHaveBeenCalledTimes(1)
  expect(nuxtMock.hook).toHaveBeenCalledTimes(1)
  jest.clearAllMocks()

  nuxtMock.options.druxt.router = { wildcard: false }
  await DruxtRouterNuxtModule.setup({}, nuxtMock)
  expect(addPluginTemplate).toHaveBeenCalledTimes(2)
  expect(addTemplate).toHaveBeenCalledTimes(0)
  expect(nuxtMock.hook).toHaveBeenCalledTimes(1)
  jest.clearAllMocks()

  nuxtMock.options.druxt.router = { pages: false }
  await DruxtRouterNuxtModule.setup({}, nuxtMock)
  expect(addPluginTemplate).toHaveBeenCalledTimes(2)
  expect(addTemplate).toHaveBeenCalledTimes(1)
  expect(nuxtMock.hook).toHaveBeenCalledTimes(2)
  expect(nuxtMock.options.build.createRoutes()).toStrictEqual([])
  jest.clearAllMocks()
})
