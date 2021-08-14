import DruxtMenuNuxtModule from '../src'

jest.mock('../src/nuxtStorybook')

const mock = {
  addPlugin: jest.fn(),
  nuxt: {
    hook: async (hook, fn) => await fn({})
  },
  options: {
    druxt: {}
  }
}

test('Nuxt module', () => {
  expect(() => { DruxtMenuNuxtModule.call({}) }).toThrow('Druxt settings missing.')

  DruxtMenuNuxtModule.call(mock)
  expect(mock.addPlugin).toHaveBeenCalled()
})

