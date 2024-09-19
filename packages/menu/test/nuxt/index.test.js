import DruxtMenuNuxtModule from '../../src/nuxt'

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
}

test('Nuxt module', async () => {
  // Use module with defaults.
  await DruxtMenuNuxtModule.setup({}, nuxtMock)
  expect(addPluginTemplate).toHaveBeenCalled()

  // Expect JSON:API Menu Items tp be enabled.
  expect(installModule).toHaveBeenLastCalledWith('druxt/nuxt', {
    baseUrl: undefined,
    menu: {
      jsonApiMenuItems: true
    }
  })

  // Use overridden options; Drupal content menu items.
  await DruxtMenuNuxtModule.setup({}, { ...nuxtMock, options: { druxt: { menu: { jsonApiMenuItems: false }}} })
  expect(installModule).toHaveBeenLastCalledWith('druxt/nuxt', {
    baseUrl: undefined,
    menu: {
      jsonApiMenuItems: false
    }
  })
})
