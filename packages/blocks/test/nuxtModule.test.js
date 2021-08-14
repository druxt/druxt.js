import { DruxtBlocksNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  nuxt: {
    hook: (hook, fn) => fn({})
  },
  DruxtBlocksNuxtModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtBlocksNuxtModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtBlocksNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
