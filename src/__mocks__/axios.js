import fs from 'fs'
import path from 'path'
import md5 from 'md5'
import mockAxios from 'jest-mock-axios'

mockAxios.get = jest.fn((url, options) => {
  let data = null
  let status = 404
  const validateStatus = true

  const file = path.resolve('src/__fixtures__/data', md5(url) + '.json')

  if (!fs.existsSync(file)) {
    data = { file, url }
    console.log(data)
    return { data, status, validateStatus }
  }

  data = require(file)
  status = 200

  if (options && options.validateStatus) {
    expect(options.validateStatus(status)).toBe(true)
  }

  return { data, status, validateStatus }
})

export default mockAxios
