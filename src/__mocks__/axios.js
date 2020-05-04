import mockAxios from 'jest-mock-axios'
import md5 from 'md5'

mockAxios.get = jest.fn((url, options) => {
  const file = `../__fixtures__/contenta/${md5(url)}.json`
  const data = require(file)
  return { data }
})

export default mockAxios
