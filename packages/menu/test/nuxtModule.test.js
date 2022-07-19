import { DruxtMenuNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

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
    druxt: {}
  }
}

test('Nuxt module', async () => {
  await DruxtMenuNuxtModule.call(mock)
  expect(mock.addPlugin).toHaveBeenCalled()
})
