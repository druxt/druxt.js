import { DruxtEntityNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addModule: jest.fn(),
  nuxt: {
    hook: (hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }
  },
  DruxtEntityNuxtModule,
}

test('Nuxt module', () => {
  mock.options = {
    druxt: {},
    modules: [],
  }
  mock.DruxtEntityNuxtModule()
})

test('Components register synchronously', async () => {
  const dirs = []
  const hook = jest.fn((name, fn) => name === 'components:dirs' && fn(dirs))
  await DruxtEntityNuxtModule.call({
    ...mock,
    addModule: jest.fn(),
    nuxt: { ...mock.nuxt, hook },
    options: { druxt: { entity: { components: { fields: true } } }, modules: [] },
  })

  // Expect every directory to mark its components as not async.
  expect(dirs).toHaveLength(2)
  for (const dir of dirs) {
    expect(dir.extendComponent({ isAsync: null })).toStrictEqual({ isAsync: false })
  }
})
