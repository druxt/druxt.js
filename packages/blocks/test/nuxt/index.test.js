import DruxtBlocksNuxtModule from '../../src/nuxt'

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
    druxt: {}
  }
  await DruxtBlocksNuxtModule.setup({}, nuxtMock)

  expect(installModule).toHaveBeenCalledTimes(1)
  expect(nuxtMock.hook).toHaveBeenCalledTimes(2)
})
