import DruxtBlocksStorybook from '../nuxtStorybook'

jest.mock('axios')

const mock = {
  addTemplate: jest.fn(),
  options: {
    buildDir: '',
    druxt: {
      baseUrl: 'https://demo-api.druxtjs.org'
    }
  }
}

test('Nuxt Storybook', async () => {
  const stories = []
  await DruxtBlocksStorybook.call(mock, { stories })
  expect(stories.length).toBe(29)
})
