import DruxtEntityNuxtModule from '../../src/nuxt'

jest.mock('../../src/nuxt/storybook')

jest.mock('@nuxt/kit', () => ({
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

describe('DruxtJS Nuxt module', () => {
  beforeEach(() => jest.clearAllMocks())
  test('Nuxt module', async () => {
    nuxtMock.options = {
      druxt: {},
      modules: [],
    }
    await DruxtEntityNuxtModule.setup({}, nuxtMock)

    expect(installModule).toHaveBeenCalledTimes(2)
    expect(nuxtMock.hook).toHaveBeenCalledTimes(2)

    // Find the hook function for 'components:dirs'
    const componentsHooks = nuxtMock.hook.mock.calls.filter(call => call[0] === 'components:dirs')
    expect(componentsHooks.length).toBe(1)

    const componentDirs = []
    // Execute the hook function to see what directories are added.
    componentsHooks[0][1](componentDirs)

    expect(componentDirs).toContainEqual({
      path: expect.stringContaining('dist/components'),
      ignore: ['fields'],
    })
  })

  test('Nuxt module - components.fields true', async () => {
    nuxtMock.options = {
      druxt: {
        entity: {
          components: {
            fields: true,
          },
        }
      },
      modules: [],
    }
    await DruxtEntityNuxtModule.setup({}, nuxtMock)

    // Find the hook function for 'components:dirs'
    const componentsHooks = nuxtMock.hook.mock.calls.filter(call => call[0] === 'components:dirs')
    expect(componentsHooks.length).toBe(1)

    const componentDirs = []
    // Execute the hook function to see what directories are added.
    componentsHooks[0][1](componentDirs)

    expect(componentDirs).toContainEqual({
      path: expect.stringContaining('dist/components/fields'),
    })
  })
})
