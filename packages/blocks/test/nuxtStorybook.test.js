import DruxtBlocksStorybook from '../src/nuxtStorybook'

jest.mock('axios')

const mock = {
  addTemplate: jest.fn(),
  options: {
    buildDir: '',
    druxt: {
      baseUrl: 'https://api.umami.demo.druxtjs.org'
    }
  }
}

test('Nuxt Storybook', async () => {
  const stories = []
  await DruxtBlocksStorybook.call(mock, { stories })
  expect(stories.length).toBe(4)
})
