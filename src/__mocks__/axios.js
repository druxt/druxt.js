import mockAxios from 'jest-mock-axios'

import mockResources from '../__fixtures__/resources'
import mockRoutes from '../__fixtures__/routes'

mockAxios.get = jest.fn((url, options) => {
  let data = null
  let status = 404
  let validateStatus = true

  if (url.split('/')[1] === 'router' && mockRoutes[url.split('?path=')[1]]) {
    data = mockRoutes[url.split('?path=')[1]]
    status = 200
  }

  else if (typeof mockResources[url] !== 'undefined') {
    data = mockResources[url]
    status = 200
  }

  if (options && options.validateStatus) {
    expect(options.validateStatus(status)).toBe(true)
  }

  return { data, status, validateStatus }
})

export default mockAxios
