import { DruxtMenuNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addPlugin: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': {}
      }
      return fn(arg[hook])
    }),
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

