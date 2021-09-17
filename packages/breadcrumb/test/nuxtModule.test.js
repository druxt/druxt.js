import { DruxtBreadcrumbModule } from '../src/nuxtModule'

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
  DruxtBreadcrumbModule
}

test('Nuxt module', () => {
  expect(() => { mock.DruxtBreadcrumbModule() }).toThrow('Druxt settings missing.')

  mock.options = {
    druxt: {}
  }
  mock.DruxtBreadcrumbModule()
  expect(mock.addPlugin).toHaveBeenCalled()
})
