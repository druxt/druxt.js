import DruxtEntityStorybook from '../../src/nuxt/storybook'

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
  await DruxtEntityStorybook.call(mock, { stories })
  expect(stories.length).toBe(2)
})
