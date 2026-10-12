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

test('Nuxt module', async () => {
  await DruxtViewsNuxtModule.call(mock)
  expect(mock.addModule).toHaveBeenCalledTimes(3)
  expect(mock.addPlugin).toHaveBeenCalledTimes(2)
})

test('Components register synchronously', async () => {
  const dirs = []
  const hook = jest.fn((name, fn) => name === 'components:dirs' && fn(dirs))
  await DruxtViewsNuxtModule.call({
    ...mock,
    addModule: jest.fn(),
    nuxt: { ...mock.nuxt, hook },
    options: { druxt: {}, modules: [] },
  })

  // Expect every directory to mark its components as not async.
  expect(dirs.length).toBeGreaterThan(0)
  for (const dir of dirs) {
    expect(dir.extendComponent({ isAsync: null })).toStrictEqual({ isAsync: false })
  }
})

test('registers a route per Views page ahead of the wildcard, and the pages plugin', async () => {
  const pages = {
    '/shop/:collection?': { viewId: 'products', displayId: 'page_1' },
    '/blog': { viewId: 'blog' },
  }
  const routes = [{ name: 'druxt-router', path: '*' }]
  const local = {
    addModule: jest.fn(),
    addPlugin: jest.fn(),
    extendRoutes: jest.fn((fn) => fn(routes)),
    nuxt: { hook: jest.fn() },
    options: { druxt: { views: { pages } }, modules: [] },
  }
  await DruxtViewsNuxtModule.call(local)
  expect(routes.map((r) => r.path)).toStrictEqual(['/shop/:collection?', '/blog', '*'])
  // A second run of the module, as a second dependant causes, adds nothing.
  await DruxtViewsNuxtModule.call(local)
  expect(routes.map((r) => r.path)).toStrictEqual(['/shop/:collection?', '/blog', '*'])
  expect(routes[0]).toMatchObject({
    name: 'druxt-views-page-shop-collection',
    meta: { druxtViewsPage: '/shop/:collection?' },
  })
  expect(routes[0].component).toMatch(/DruxtViewsPage\.vue$/)
  const plugin = local.addPlugin.mock.calls.find(([p]) => p.fileName === 'druxt-views-pages.js')[0]
  expect(plugin.options.pages).toStrictEqual(pages)
})

test('registers no route and an empty pages map without pages', async () => {
  const local = { ...mock, addPlugin: jest.fn(), extendRoutes: jest.fn(), options: { druxt: {}, modules: [] } }
  await DruxtViewsNuxtModule.call(local)
  expect(local.extendRoutes).not.toHaveBeenCalled()
  const plugin = local.addPlugin.mock.calls.find(([p]) => p.fileName === 'druxt-views-pages.js')[0]
  expect(plugin.options.pages).toStrictEqual({})
})

