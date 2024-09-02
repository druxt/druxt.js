import { resolve } from 'path'
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
  await DruxtEntityStorybook.call(mock, { options: mock.options.druxt, stories })
  expect(stories.map((s) => s.replace(resolve(''), ''))).toMatchSnapshot()
  expect(stories.length).toBe(2)
})
