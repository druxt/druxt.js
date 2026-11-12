import { cacheClearHandler } from '../../src/nuxt/cacheClear'
import { processCache, resetProcessCache, runtime } from '../../src/utils/processCache'

const axios = { defaults: { headers: { common: {} } } }

const call = (handler, { method = 'POST', headers = {}, url = '/' } = {}) => {
  const res = { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name] = value }, end: jest.fn() }
  handler({ method, headers, url }, res)
  return res
}

describe('cache clear endpoint', () => {
  const { isServer } = runtime
  beforeEach(() => {
    resetProcessCache()
    runtime.isServer = () => true
    processCache('index', { axios }).set('key', 'value', 300)
  })
  afterAll(() => { runtime.isServer = isServer })

  const stored = () => processCache('index', { axios }).get('key')
  const handler = cacheClearHandler('correct-horse-battery')

  test('clears the process cache for the right secret', () => {
    const res = call(handler, { headers: { 'x-druxt-secret': 'correct-horse-battery' } })
    expect(res.statusCode).toBe(204)
    expect(res.end).toHaveBeenCalled()
    expect(stored()).toBe(undefined)
  })

  test('refuses a missing, wrong or query-string secret', () => {
    for (const request of [{}, { headers: { 'x-druxt-secret': 'correct-horse-buttery' } }, { headers: { 'x-druxt-secret': 'correct-horse' } }, { url: '/?secret=correct-horse-battery' }]) {
      expect(call(handler, request).statusCode).toBe(401)
      expect(stored()).toBe('value')
    }
  })

  test('accepts POST only', () => {
    const res = call(handler, { method: 'GET', headers: { 'x-druxt-secret': 'correct-horse-battery' } })
    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
    expect(stored()).toBe('value')
  })
})
