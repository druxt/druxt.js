import DruxtMenuStorybook from '../../src/nuxt/storybook'

jest.mock('axios')

const mock = {
  addTemplate: jest.fn(),
  options: {
    buildDir: '',
    druxt: {
      baseUrl: 'https://demo-api.druxtjs.org',
      menu: {
        jsonApiMenuItems: true
      }
    }
  }
}

test('Nuxt Storybook', async () => {
  const stories = []
  await DruxtMenuStorybook.call(mock, { stories })
  expect(stories.length).toBe(2)
})
