import { DruxtEntityNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  nuxt: {
    hook: (hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }
  },
  DruxtEntityNuxtModule,
}

test('Nuxt module', () => {
  mock.options = {
    druxt: {},
    modules: [],
  }
  mock.DruxtEntityNuxtModule()
})
