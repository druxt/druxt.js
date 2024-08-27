import DruxtSiteNuxtModule from '../../src/nuxt'

jest.mock('../../src/nuxt/storybook')

jest.mock('@nuxt/kit', () => ({
  addLayout: jest.fn(),
  defineNuxtModule: (module) => module,
  installModule: jest.fn(),
}))

import { installModule } from '@nuxt/kit'

const nuxtMock = {
  hook: jest.fn((hook, fn) => {
    const arg = {
      'components:dirs': [],
      'storybook:config': { stories: [] }
    }
    return fn(arg[hook])
  }),
}

jest.mock('druxt-schema')

describe('DruxtJS Site module', () => {
  test('Nuxt module', async () => {
    nuxtMock.options = {
      dir: { layouts: 'layouts' },
      druxt: {},
      srcDir: __dirname,
    }

    // Call DruxtSite module.
    await await DruxtSiteNuxtModule.setup({}, nuxtMock)

    // Expect 9 modules to be added.
    expect(installModule).toHaveBeenCalledTimes(8)
  })
})
