import { DruxtEntityNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  nuxt: {
    hook: (hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': {}
      }
      return fn(arg[hook])
    }
  },
  DruxtEntityNuxtModule,
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtEntityNuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {},
    modules: [],
  }
  mock.DruxtEntityNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
