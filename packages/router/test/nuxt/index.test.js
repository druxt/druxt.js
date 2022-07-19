import DruxtRouterNuxtModule from '../../nuxt'

const mock = {
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  extendRoutes: jest.fn((func) => {
    const routes = []
    const resolve = jest.fn()

    func(routes, resolve)
  }),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }),
    options: { build: {} }
  },
  DruxtRouterNuxtModule
}

test('Nuxt module', async () => {
  mock.options = {
    buildDir: '',
    dir: { pages: 'pages' },
    druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
    srcDir: __dirname,
  }

  mock.options.druxt.router = { pages: true }
  await mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
  expect(mock.addTemplate).toHaveBeenCalledTimes(2)
  expect(mock.nuxt.hook).toHaveBeenCalledTimes(2)
  jest.clearAllMocks()

  mock.options.druxt.router = { wildcard: false }
  await mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
  expect(mock.addTemplate).toHaveBeenCalledTimes(1)
  expect(mock.nuxt.hook).toHaveBeenCalledTimes(2)
  jest.clearAllMocks()

  mock.options.druxt.router = { pages: false }
  await mock.DruxtRouterNuxtModule()
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
  expect(mock.addTemplate).toHaveBeenCalledTimes(2)
  expect(mock.nuxt.hook).toHaveBeenCalledTimes(3)
  expect(mock.nuxt.options.build.createRoutes()).toStrictEqual([])
  jest.clearAllMocks()
})
