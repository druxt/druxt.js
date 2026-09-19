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
  expect(mock.addPlugin).toHaveBeenCalledTimes(1)
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
