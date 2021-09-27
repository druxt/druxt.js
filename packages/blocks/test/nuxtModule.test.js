import { DruxtBlocksNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }),
  },
  DruxtBlocksNuxtModule
}

test('Nuxt module', () => {
  mock.options = {
    druxt: {}
  }
  mock.DruxtBlocksNuxtModule()
})
