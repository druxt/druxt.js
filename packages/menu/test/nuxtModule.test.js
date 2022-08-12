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
  // Use module with defaults.
  await DruxtMenuNuxtModule.call(mock)
  expect(mock.addPlugin).toHaveBeenCalled()

  // Expect JSON:API Menu Items tp be enabled.
  expect(mock.addModule).toHaveBeenLastCalledWith(['druxt', {
    baseUrl: undefined,
    menu: {
      jsonApiMenuItems: true
    }
  }])

  // Use overridden options; Drupal content menu items.
  await DruxtMenuNuxtModule.call({ ...mock, options: { druxt: { menu: { jsonApiMenuItems: false }}} })
  expect(mock.addModule).toHaveBeenLastCalledWith(['druxt', {
    baseUrl: undefined,
    menu: {
      jsonApiMenuItems: false
    }
  }])
})
