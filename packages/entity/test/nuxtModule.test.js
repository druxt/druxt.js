import DruxtEntityNuxtModule from '../src'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  nuxt: {
    hook: (hook, fn) => fn({})
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
