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
  expect(mock.nuxt.hook).toHaveBeenCalledTimes(3)
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
  expect(mock.nuxt.hook).toHaveBeenCalledTimes(4)
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

test('the routes are added once every module is in, so a module listed later, such as i18n, can\'t rewrite them', async () => {
  const order = []
  const hooks = {}
  const args = { 'components:dirs': [], 'storybook:config': { stories: [] } }
  await DruxtRouterNuxtModule.call({
    ...mock,
    extendRoutes: jest.fn(() => order.push('druxt')),
    nuxt: { ...mock.nuxt, hook: jest.fn((name, fn) => name === 'modules:done' ? (hooks[name] = fn) : fn(args[name])) },
    options: { buildDir: '', dir: { pages: 'pages' }, druxt: { baseUrl: 'https://languages.test', prefixes: { en: '', es: 'es' }, router: {} }, srcDir: __dirname },
  })

  // A module after Druxt in the list, such as @nuxtjs/i18n, which rewrites the routes there are when it runs.
  order.push('i18n')
  await hooks['modules:done']()
  expect(order).toStrictEqual(['i18n', 'druxt'])
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

  expect(routes.map(({ name, meta }) => [name, meta])).toStrictEqual([
    ['druxt-router__es__home', { langcode: 'es' }],
    ['druxt-router__es', { langcode: 'es' }],
    ['druxt-router', undefined],
  ])

  // The prefix is a whole path segment, so an English path that starts with its letters stays on the wildcard route.
  const VueRouter = require('vue-router')
  const router = new (VueRouter.default || VueRouter)({ mode: 'abstract', routes: routes.map(({ name, path }) => ({ name, path, component: {} })) })
  const routeFor = (path) => router.resolve(path).route.name
  expect(routeFor('/spanish')).toBe('druxt-router__es__home')
  expect(routeFor('/spanish/')).toBe('druxt-router__es__home')
  expect(routeFor('/spanish/article')).toBe('druxt-router__es')
  expect(routeFor('/spanish-food')).toBe('druxt-router')
  expect(routeFor('/')).toBe('druxt-router')

  // Vue Router builds the path again from the route's params for a navigation with params or a name, as a change to
  // the query can be. The path survives it.
  for (const path of ['/spanish', '/spanish/article', '/spanish/recipes/a-recipe']) {
    const current = router.resolve(path).route
    expect(router.resolve({ params: {}, query: { page: '2' } }, current).route.fullPath).toBe(`${path}?page=2`)
    expect(router.resolve({ name: current.name, params: current.params, query: { page: '2' } }, current).route.fullPath).toBe(`${path}?page=2`)
  }
})
