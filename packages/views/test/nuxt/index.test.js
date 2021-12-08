import { DruxtViewsNuxtModule } from '../../src/nuxt'

jest.mock('../../src/nuxt/storybook')

const mock = {
  addModule: jest.fn(),
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
    druxt: {},
    modules: [],
  },
}

test('Nuxt module', () => {
  DruxtViewsNuxtModule.call(mock)
  expect(mock.addModule).toHaveBeenCalledTimes(3)
  expect(mock.addPlugin).toHaveBeenCalledTimes(1)
})
