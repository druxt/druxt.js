import fs from 'fs'
import path from 'path'
import md5 from 'md5'
import mockAxios from 'jest-mock-axios'

const mockData = (url, file) => {
  if (!fs.existsSync(file)) {
    console.warn(`Missing mock data: ${file} ${url}`)
    return { data: { file, url }, status: 404 }
  }

  const data = require(file)

  // Throw error if error data is present.
  if (data.errors) {
    const error = new Error
    error.response = { data }
    throw error
  }

  return { data, status: 200 }
}

// Mock 'get' requests.
mockAxios.get = jest.fn((url, options) => 
  mockData(url, path.resolve('src/__fixtures__/get', md5(url) + '.json'))
)

export default mockAxios
