/**
 * @jest-environment node
 */
// A server render, so the process cache in the built druxt package is in use.
import { DruxtClient } from 'druxt'
import { DruxtRouter } from '../src'

// Each router gets its own Axios instance below; the shared mock loads the browser build, which needs a window.
jest.mock('axios', () => ({ create: jest.fn() }))

const baseUrl = 'https://demo-api.druxtjs.org'

let lookups = []

// Each server request gets its own Axios instance, and so its own client and router.
const requestRouter = ({ status = 200, cache = { content: true } } = {}) => {
  const axios = jest.fn()
  axios.defaults = { headers: { common: {} } }
  axios.interceptors = { response: { use: () => {} } }
  axios.get = jest.fn(async (url) => {
    lookups.push(url)
    const data = status === 200
      ? { resolved: `${baseUrl}/node/1`, isHomePath: false, entity: { uuid: 'a', type: 'node', bundle: 'page' }, jsonapi: { resourceName: 'node--page' }, label: 'Page' }
      : { message: 'Unable to resolve path /missing.' }
    return { status, headers: { 'cache-control': 'public, max-age=300' }, data }
  })
  const druxtClient = new DruxtClient(baseUrl, { axios, cache })
  return new DruxtRouter(baseUrl, { druxtClient })
}

describe('DruxtRouter content cache', () => {
  beforeEach(() => {
    // Empties the process cache the built client holds.
    requestRouter().druxt.clearCache()
    lookups = []
  })

  test('a route lookup is answered from the process cache on the next server request', async () => {
    const first = await requestRouter().getRoute('/node/1')
    const second = await requestRouter().getRoute('/node/1')
    expect(lookups).toStrictEqual(['/router/translate-path?path=/node/1'])
    expect(second).toStrictEqual(first)
    expect(second.label).toBe('Page')
  })

  test('a path Drupal cannot resolve is asked again', async () => {
    // The router reports a 404 as an error once the lookup is back.
    await expect(requestRouter({ status: 404 }).getRoute('/missing')).rejects.toThrow('404')
    await expect(requestRouter({ status: 404 }).getRoute('/missing')).rejects.toThrow('404')
    expect(lookups).toHaveLength(2)
  })

  test('off unless cache.content is set', async () => {
    await requestRouter({ cache: {} }).getRoute('/node/1')
    await requestRouter({ cache: {} }).getRoute('/node/1')
    expect(lookups).toHaveLength(2)
  })
})
