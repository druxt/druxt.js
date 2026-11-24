import DruxtRouterNuxtModule from '../../src/nuxt'

// The source reads the manifest one level up, where the built module finds it.
jest.mock('../../src/package.json', () => require('../../package.json'), { virtual: true })

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
    druxt: { baseUrl: 'https://api.umami.demo.druxtjs.org' },
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

test('Components register synchronously', async () => {
  const dirs = []
  const hook = jest.fn((name, fn) => name === 'components:dirs' && fn(dirs))
  await DruxtRouterNuxtModule.call({
    ...mock,
    addModule: jest.fn(),
    nuxt: { ...mock.nuxt, hook },
    options: { buildDir: '', dir: { pages: 'pages' }, druxt: { baseUrl: 'https://api.umami.demo.druxtjs.org' }, srcDir: __dirname },
  })

  // Expect every directory to mark its components as not async.
  expect(dirs.length).toBeGreaterThan(0)
  for (const dir of dirs) {
    expect(dir.extendComponent({ isAsync: null })).toStrictEqual({ isAsync: false })
  }
})

test('a route for each language under its prefix', async () => {
  const { stubLanguages } = require('../../../../test/languages')
  const stub = stubLanguages({ baseUrl: 'https://languages.test', prefixes: { en: '', es: 'spanish' }, decoupled: true })
  let routes
  const extendRoutes = jest.fn((func) => { routes = []; func(routes, jest.fn()) })
  try {
    await DruxtRouterNuxtModule.call({
      ...mock,
      extendRoutes,
      options: { buildDir: '', dir: { pages: 'pages' }, druxt: { baseUrl: 'https://languages.test', router: {} }, srcDir: __dirname },
    })
  } finally {
    stub.restore()
  }

  expect(routes.map(({ name, path, meta }) => [name, path, meta])).toStrictEqual([
    ['druxt-router__es', '/spanish*', { langcode: 'es' }],
    ['druxt-router', '*', undefined],
  ])
})
