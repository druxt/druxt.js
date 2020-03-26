import DruxtBreadcrumbPlugin from '..'

const addPlugin = jest.fn()

test('Nuxt Plugin', () => {
  DruxtBreadcrumbPlugin.call({ addPlugin })
  expect(addPlugin).toHaveBeenCalled()
})
