import DruxtViewsNuxtModule from '../../src/nuxt'

jest.mock('../../src/nuxt/storybook')

jest.mock('@nuxt/kit', () => ({
  addPluginTemplate: jest.fn(),
  defineNuxtModule: (module) => module,
  installModule: jest.fn(),
}))

import { addPluginTemplate, installModule } from '@nuxt/kit'

const nuxtMock = {
  hook: jest.fn((hook, fn) => {
    const arg = {
      'components:dirs': [],
      'storybook:config': { stories: [] }
    }
    return fn(arg[hook])
  }),
  options: {},
}

test('Nuxt module', async () => {
  await DruxtViewsNuxtModule.setup({}, nuxtMock)
  expect(installModule).toHaveBeenCalledTimes(3)
  expect(addPluginTemplate).toHaveBeenCalledTimes(1)
})
