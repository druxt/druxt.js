import mockAxios from 'jest-mock-axios'

import mockResources from '../__fixtures__/resources'
import mockRoutes from '../__fixtures__/routes'

mockAxios.get = jest.fn(url => {
  let data = null

  if (url.split('/')[1] === 'router') {
    data = mockRoutes[url.split('?path=')[1]]
  }

  else if (typeof mockResources[url] !== 'undefined') {
    data = mockResources[url]
  }

  return { data }
})

export default mockAxios
