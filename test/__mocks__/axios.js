import axios from 'axios/dist/axios'
import fs from 'fs'
import md5 from 'md5'
import path from 'path'
import mockAxios from 'jest-mock-axios'

const mockData = async (url, file) => {
  let data

  // If the file isn't present, try to get it.
  if (!fs.existsSync(file)) {
    const axiosClient = axios.create({
      baseURL: 'https://demo-api.druxtjs.org'
    })
    try {
      data = (await axiosClient.get(url)).data
      await fs.writeFileSync(file, JSON.stringify(data, null, '  '))
    } catch (err) {
      console.log(err)
    }
    mockAxios.reset()
  }

  // If the file still isn't present, error.
  if (!fs.existsSync(file)) {
    console.warn(`Missing mock data: ${file} ${url}`)
    return { data: { file, url }, status: 404 }
  }

  data = data ? data : require(file)

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
  if (url === '/jsonapi/missing/test') {
    throw new Error('Error')
  }
  return mockData(url, path.resolve('./test/__fixtures__/get', md5(url) + '.json'))
})

// Mock 'patch' requests.
mockAxios.patch = jest.fn((url, data, options) =>
  mockData(url, path.resolve('./test/__fixtures__/patch', md5(url), md5(JSON.stringify(data)) + '.json'))
)

// Mock 'post' requests.
mockAxios.post = jest.fn((url, data, options) =>
  mockData(url, pathe.resolve('./test/__fixtures__/post', md5(url), md5(JSON.stringify(data)) + '.json'))
)

export default mockAxios
