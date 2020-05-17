import fs from 'fs'
import path from 'path'
import mockAxios from 'jest-mock-axios'
import md5 from 'md5'

mockAxios.get = jest.fn((url, options) => {
  const file = path.resolve('src/__fixtures__/contenta', md5(url) + '.json')

  if (!fs.existsSync(file)) {
    return false
  }

  const data = require(file)
  return { data }
})

export default mockAxios
