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
mockAxios.get = jest.fn((url, options) => {
  return mockData(url, path.resolve('src/__fixtures__/get', md5(url) + '.json'))
})

// Mock 'patch' requests.
mockAxios.patch = jest.fn((url, data, options) => 
  mockData(url, path.resolve('src/__fixtures__/patch', md5(url), md5(JSON.stringify(data)) + '.json'))
)

// Mock 'post' requests.
mockAxios.post = jest.fn((url, data, options) => 
  mockData(url, path.resolve('src/__fixtures__/post', md5(url), md5(JSON.stringify(data)) + '.json'))
)

export default mockAxios
