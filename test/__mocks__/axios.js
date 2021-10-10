import axios from 'axios/dist/axios'
import fs from 'fs'
import md5 from 'md5'
import path from 'path'
import mockAxios from 'jest-mock-axios'

const mockData = async (request, file) => {
  let response

  // If the file isn't present, try to get it.
  if (!fs.existsSync(file)) {
    const axiosClient = axios.create({
      baseURL: 'https://demo-api.druxtjs.org'
    })
    console.log(`Attempting to create mock: ${file}`)
    try {
      response = await axiosClient(request)
      await fs.writeFileSync(file, JSON.stringify(response, null, '  '))
    } catch (err) {
      await fs.writeFileSync(file, JSON.stringify(err.response, null, '  '))
    }
    mockAxios.reset()
  }

  // If the file still isn't present, error.
  if (!fs.existsSync(file)) {
    console.warn(`Missing mock data: ${file} ${url}`)
    return { data: { file, url }, status: 404 }
  }

  response = response ? response : require(file)

  // Throw error if error data is present.
  if (response.data.errors) {
    const error = new Error
    error.response = response
    throw error
  }

  return response
}

// Mock 'get' requests.
mockAxios.get = jest.fn((url, options) => {
  if (url === '/jsonapi/missing/test') {
    throw new Error('Error')
  }

  const file = path.resolve('./test/__fixtures__/get', md5(url) + '.json')
  const request = { method: 'get', url }
  return mockData(request, file)
})

// Mock 'patch' requests.
mockAxios.patch = jest.fn((url, data, options) => {
  const file = path.resolve('./test/__fixtures__/patch', md5(url), md5(JSON.stringify(data)) + '.json')
  const request = { data, method: 'patch', options, url }
  return mockData(request, file)
})

// Mock 'post' requests.
mockAxios.post = jest.fn((url, data, options) => {
  const file = path.resolve('./test/__fixtures__/post', md5(url), md5(JSON.stringify(data)) + '.json')
  const request = { data, method: 'post', options, url }
  return mockData(request, file)
})

export default mockAxios
