import * as DruxtFieldComponents from '../../../src/components/fields'

global.console = {
  warn: jest.fn(),
}

describe('DruxtFieldComponents - Deprecations', () => {
  beforeEach(() => {
    global.console.warn.mockClear()
  })

  for (const component of Object.keys(DruxtFieldComponents)) {
    test(component, async () => {
      DruxtFieldComponents[component].mounted.call({
        $options: {
          _componentTag: component,
        },
      })
      expect(console.warn).toHaveBeenCalledWith(
        `[druxt-entity] The ${component} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`
      )
    })
  }
})
