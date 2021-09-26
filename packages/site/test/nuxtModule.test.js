import { DruxtSiteNuxtModule } from '../src/nuxtModule'

const mock = {
  addLayout: jest.fn(),
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': {}
      }
      return fn(arg[hook])
    }),
  },
  DruxtSiteNuxtModule
}

jest.mock('druxt-schema')

describe('DruxtJS Site module', () => {
  test('Nuxt module', async () => {
    mock.options = {
      dir: { layouts: 'layouts' },
      druxt: {},
      srcDir: __dirname,
    }

    // Call DruxtSite module.
    await mock.DruxtSiteNuxtModule()

    // Expect 9 modules to be added.
    expect(mock.addModule).toHaveBeenCalledTimes(9)
  })
})
