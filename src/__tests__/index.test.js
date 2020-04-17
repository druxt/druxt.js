import DruxtMenuPlugin from '..'

const addPlugin = jest.fn()

test('Nuxt Plugin', () => {
  DruxtMenuPlugin.call({ addPlugin })
  expect(addPlugin).toHaveBeenCalled()
})
