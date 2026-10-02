import fs from 'fs'
import path from 'path'
import template from 'lodash/template'
import mockAxios from 'jest-mock-axios'

import { DruxtMenu } from '../../src'

jest.mock('axios')

const baseUrl = 'https://demo-api.druxtjs.org'

// Renders the plugin template as Nuxt does and returns its default export.
const plugin = (options, client) => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../templates/plugin.js'), 'utf8')
  const rendered = template(source, { interpolate: /<%=([\s\S]+?)%>/g })({ options })
    .replace(/^import .*$/m, '')
    .replace('export default', 'return')
  return new Function('DruxtMenu', 'process', rendered)(DruxtMenu, { client })
}

// The base URL the plugin's own client was built with.
const builtWith = () => mockAxios.create.mock.calls[mockAxios.create.mock.calls.length - 1][0].baseURL

describe('druxt-menu plugin', () => {
  beforeEach(() => {
    mockAxios.reset()
    mockAxios.create.mockClear()
  })

  test('in the browser, a client built by the plugin sends its requests through the proxy', () => {
    const inject = jest.fn()
    plugin({ baseUrl, proxy: { api: true } }, true)({ app: {} }, inject)
    expect(inject).toHaveBeenCalledWith('druxtMenu', expect.any(DruxtMenu))
    expect(builtWith()).toBe(undefined)
  })

  test('on the server, the client talks to the backend directly', () => {
    plugin({ baseUrl, proxy: { api: true } }, false)({ app: {} }, jest.fn())
    expect(builtWith()).toBe(baseUrl)
  })

  test('without the proxy, the browser talks to the backend directly', () => {
    plugin({ baseUrl }, true)({ app: {} }, jest.fn())
    expect(builtWith()).toBe(baseUrl)
  })

  test('the druxt module client is reused when present', () => {
    const inject = jest.fn()
    const $druxt = { index: {} }
    plugin({ baseUrl, proxy: { api: true } }, true)({ app: { $druxt } }, inject)
    expect(inject.mock.calls[0][1].druxt).toBe($druxt)
    expect(mockAxios.create).not.toHaveBeenCalled()
  })
})
