import { DruxtSiteNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook')

const mock = {
  addLayout: jest.fn(),
  addModule: jest.fn(),
  addPlugin: jest.fn(),
  addTemplate: jest.fn(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] }
      }
      return fn(arg[hook])
    }),
    resolver: {
      requireModule: jest.fn((id) => require(id)),
    },
  },
  DruxtSiteNuxtModule
}

jest.mock('druxt-schema')

describe('DruxtJS Site module', () => {
  test('Nuxt module', async () => {
    mock.options = {
      dir: { layouts: 'layouts' },
      druxt: {},
      srcDir: __dirname,
    }

    // Call DruxtSite module.
    await mock.DruxtSiteNuxtModule()

    // Expect 9 modules to be added.
    expect(mock.addModule).toHaveBeenCalledTimes(8)
  })
})

test('Components register synchronously', async () => {
  const dirs = []
  const hook = jest.fn((name, fn) => name === 'components:dirs' && fn(dirs))
  await DruxtSiteNuxtModule.call({
    ...mock,
    addModule: jest.fn(),
    nuxt: { ...mock.nuxt, hook },
    options: { dir: { layouts: 'layouts' }, druxt: {}, srcDir: __dirname },
  })

  // Expect every directory to mark its components as not async.
  expect(dirs.length).toBeGreaterThan(0)
  for (const dir of dirs) {
    expect(dir.extendComponent({ isAsync: null })).toStrictEqual({ isAsync: false })
  }
})
