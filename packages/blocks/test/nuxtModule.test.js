import { DruxtBlocksNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }),
  },
  DruxtBlocksNuxtModule
}

test('Nuxt module', () => {
  mock.options = {
    druxt: {}
  }
  mock.DruxtBlocksNuxtModule()
})

test('Components register synchronously', async () => {
  const dirs = []
  const hook = jest.fn((name, fn) => name === 'components:dirs' && fn(dirs))
  await DruxtBlocksNuxtModule.call({
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
