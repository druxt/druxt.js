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

test('Components register synchronously', async () => {
  const dirs = []
  const hook = jest.fn((name, fn) => name === 'components:dirs' && fn(dirs))
  await DruxtMenuNuxtModule.call({
    ...mock,
    addModule: jest.fn(),
    nuxt: { ...mock.nuxt, hook },
    options: { druxt: {} },
  })

  // Expect every directory to mark its components as not async.
  expect(dirs.length).toBeGreaterThan(0)
  for (const dir of dirs) {
    expect(dir.extendComponent({ isAsync: null })).toStrictEqual({ isAsync: false })
  }
})
