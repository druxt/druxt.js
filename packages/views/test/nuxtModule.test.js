import DruxtViewsNuxtModule from '../src'

jest.mock('../nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  nuxt: {
    hook: async (hook, fn) => await fn({})
  },
  options: {
    druxt: {},
    modules: [],
  },
}

test('Nuxt module', () => {
  expect(() => { DruxtViewsNuxtModule.call({}) }).toThrow('Druxt settings missing.')

  DruxtViewsNuxtModule.call(mock)
  expect(mock.addModule).toHaveBeenCalledTimes(3)
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
})
