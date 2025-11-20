import { DruxtBlocksNuxtModule } from '../src/nuxtModule'

jest.mock('../src/nuxtStorybook', () => jest.fn().mockResolvedValue(), {
  virtual: true,
})

const mock = {
  addModule: jest.fn().mockResolvedValue(),
  nuxt: {
    hook: jest.fn((hook, fn) => {
      const arg = {
        'components:dirs': [],
        'storybook:config': { stories: [] },
      }
      // Call the function and return the promise
      return fn(arg[hook])
    }),
  },
  DruxtBlocksNuxtModule,
}

// Test Nuxt module initialization and hook registration.
// This verifies that the module sets up Druxt integration and registers necessary hooks.
// How: Call the module function with mock context and assert hooks are registered.
// Why: To ensure the module properly integrates with Nuxt.js and enables Druxt functionality.
test('Nuxt module', async () => {
  mock.options = {
    druxt: {},
  }
  await mock.DruxtBlocksNuxtModule()
})
