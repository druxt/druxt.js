import { readFileSync } from 'fs'
import { resolve } from 'path'
import template from 'lodash/template'

const source = readFileSync(resolve(__dirname, '../../templates/plugin.js'), 'utf8')

// Renders the plugin as Nuxt does, then runs it with the given globals in place of webpack's.
const plugin = ({ refresh, server, files = {}, fetch, hook }) => {
  const rendered = template(source, { interpolate: /<%=([\s\S]+?)%>/g })({ options: { schema: { refresh } } })
    .replace('export default ', 'return ')
    .split('import(`./schemas/${id}.json`)').join('__file(id)')
  const process = { server: !!server }
  if (hook) process[Symbol.for('druxt.schemaRefresh')] = hook
  const file = (id) => (id in files ? Promise.resolve({ default: files[id] }) : Promise.reject(new Error(`No file ${id}`)))
  const create = new Function('process', 'fetch', '__file', rendered)
  const install = create(process, fetch, file)
  let injected
  install({ app: { router: { options: { base: '/site' } } } }, (name, value) => { injected = value })
  return injected
}

describe('druxt-schema plugin template', () => {
  test('without refresh, the built file', async () => {
    const fetch = jest.fn()
    const druxtSchema = plugin({ refresh: false, files: { 'node--page--default--view': { v: 'built' } }, fetch })
    expect(await druxtSchema.import('node--page--default--view')).toStrictEqual({ v: 'built' })
    expect(fetch).not.toHaveBeenCalled()
  })

  test('on the server, the held schema, else the built file', async () => {
    const hook = jest.fn(async (id) => (id === 'node--page--default--view' ? { v: 'held' } : null))
    const files = { 'node--page--default--view': { v: 'built' }, 'node--article--default--view': { v: 'built article' } }
    const druxtSchema = plugin({ refresh: true, server: true, files, hook })

    expect(await druxtSchema.import('node--page--default--view')).toStrictEqual({ v: 'held' })
    expect(await druxtSchema.import('node--article--default--view')).toStrictEqual({ v: 'built article' })
  })

  test('in the browser, the server route under the router base, else the built file', async () => {
    const fetch = jest.fn(async (url) => (url === '/site/_druxt/schema/node--page--default--view'
      ? { ok: true, json: async () => ({ v: 'route' }) }
      // A host without the route, such as a static site, answers a plain 404.
      : { ok: false, status: 404, headers: { get: () => null } }))
    const files = { 'node--article--default--view': { v: 'built article' } }
    const druxtSchema = plugin({ refresh: true, files, fetch })

    expect(await druxtSchema.import('node--page--default--view')).toStrictEqual({ v: 'route' })
    expect(await druxtSchema.import('node--article--default--view')).toStrictEqual({ v: 'built article' })
  })

  test('a missing mode falls back to the default mode, refreshed first', async () => {
    const hook = jest.fn(async (id) => (id === 'node--page--default--view' ? { v: 'held default' } : false))
    const druxtSchema = plugin({ refresh: true, server: true, hook })

    expect(await druxtSchema.import('node--page--teaser--view')).toStrictEqual({ v: 'held default' })
  })
  test('a schema Drupal no longer has is not served from the build', async () => {
    const files = { 'node--page--teaser--view': { v: 'built teaser' }, 'node--page--default--view': { v: 'built default' } }

    // On the server.
    const hook = jest.fn(async (id) => (id === 'node--page--default--view' ? { v: 'held default' } : false))
    expect(await plugin({ refresh: true, server: true, files, hook }).import('node--page--teaser--view')).toStrictEqual({ v: 'held default' })

    // In the browser, where the route marks the 404.
    const fetch = jest.fn(async (url) => (url.endsWith('node--page--default--view')
      ? { ok: true, json: async () => ({ v: 'route default' }) }
      : { ok: false, status: 404, headers: { get: (name) => (name === 'X-Druxt-Schema' ? 'missing' : null) } }))
    expect(await plugin({ refresh: true, files, fetch }).import('node--page--teaser--view')).toStrictEqual({ v: 'route default' })

    // With no default either, the load fails as a missing built file does.
    await expect(plugin({ refresh: true, server: true, files, hook: async () => false }).import('node--page--default--view')).rejects.toThrow('No Druxt schema')
  })
})
