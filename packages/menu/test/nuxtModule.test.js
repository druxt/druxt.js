import { DruxtMenuNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addPlugin: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }),
  },
  options: {
    druxt: {}
  }
}

test('Nuxt module', () => {
  DruxtMenuNuxtModule.call(mock)
  expect(mock.addPlugin).toHaveBeenCalled()
})
