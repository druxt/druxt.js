import DruxtBlocksStorybook from '../src/nuxtStorybook'

jest.mock('axios')
jest.mock('druxt', () => ({
  DruxtClient: jest.fn().mockImplementation((baseUrl, options) => {
    // Ensure constructor is called with expected parameters
    expect(typeof baseUrl).toBe('string')
    expect(options).toHaveProperty('proxy')
    return {
      getCollectionAll: jest.fn().mockResolvedValue([
        {
          data: {
            attributes: {
              theme: 'umami',
              region: 'header',
              drupal_internal__id: 'test_block',
            },
          },
        },
      ]),
    }
  }),
}))

const mock = {
  addTemplate: jest.fn(),
  options: {
    buildDir: '',
    druxt: {
      baseUrl: 'https://demo-api.druxtjs.org',
    },
  },
}

// Test Nuxt Storybook integration for block components.
// This verifies that the storybook function generates stories for all block types.
// How: Call the storybook function with mock context and assert stories are added.
// Why: To ensure developers can preview and test block components in Storybook.
test('Nuxt Storybook', async () => {
  const stories = []
  await DruxtBlocksStorybook.call(mock, { stories })
  expect(stories.length).toBe(4)
})
