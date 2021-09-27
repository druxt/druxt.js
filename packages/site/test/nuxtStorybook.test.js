import DruxtEntityStorybook from '../src/nuxtStorybook'

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
  await DruxtEntityStorybook.call(mock, { options: mock.options.druxt, stories })
  expect(stories.length).toBe(4)
})
