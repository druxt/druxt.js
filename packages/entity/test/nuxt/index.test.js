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

test('Nuxt module', async () => {
  nuxtMock.options = {
    druxt: {},
    modules: [],
  }
  await DruxtEntityNuxtModule.setup({}, nuxtMock)

  expect(installModule).toHaveBeenCalledTimes(2)
  expect(nuxtMock.hook).toHaveBeenCalledTimes(2)
})
