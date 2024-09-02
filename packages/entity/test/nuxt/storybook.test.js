import DruxtEntityStorybook from '../../src/nuxt/storybook'

jest.mock('axios')

jest.mock('@nuxt/kit', () => ({
  addTemplate: jest.fn(),
}))

const mock = {
  options: {
    buildDir: '',
    druxt: {
      baseUrl: 'https://demo-api.druxtjs.org'
    }
  }
}

test('Nuxt Storybook', async () => {
  const stories = []
  await DruxtEntityStorybook.call(mock, { stories })
  expect(stories.length > 0).toBe(true)
})
