import { DruxtBreadcrumbModule } from '../src/nuxtModule'

const mock = {
  addTemplate: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }),
  },
  DruxtBreadcrumbModule
}

test('Nuxt module', () => {
  mock.options = {
    buildDir: 'build',
    druxt: {}
  }
  DruxtBreadcrumbModule.call(mock)
})
