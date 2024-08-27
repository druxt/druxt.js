import DruxtBlocksStorybook from '../../src/nuxt/storybook'

jest.mock('axios')

jest.mock('@nuxt/kit', () => ({
  addTemplate: jest.fn(),
  defineNuxtModule: (module) => module,
}))

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
  expect(stories.length).toBe(4)
})
