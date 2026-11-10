import { describe, expect, it } from 'vitest'
import { DruxtClient, DruxtPermissionsError } from '../../packages/client/src'
import type { DruxtError, JsonApiDocument } from '../../packages/client/src'
import { BASE_URL, drupal, index, json } from './fake-drupal'

const rejection = (promise: Promise<unknown>): Promise<DruxtError> => promise.then(
  () => { throw new Error('Expected a rejection.') },
  (error: unknown) => error as DruxtError,
)

const thrown = (fn: () => void): unknown => {
  try {
    fn()
  } catch (error) {
    return error
  }
  return undefined
}

describe('errors', () => {
  it('carries the status, the JSON:API errors and the request URL', async () => {
    const errors = [{ status: '404', title: 'Not Found', detail: 'The "node" entity with ID "missing" does not exist.' }]
    const { fetch } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/article/missing': () => json({ errors }, 404) })
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).getResource('node--article', 'missing'))
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(`404: Not Found\n\nURL: ${BASE_URL}/jsonapi/node/article/missing\n\n${errors[0]!.detail}`)
    expect(error.response).toMatchObject({ status: 404, statusText: 'Not Found', url: `${BASE_URL}/jsonapi/node/article/missing`, data: { errors } })
    expect(error.druxt).toEqual({ url: '/jsonapi/node/article/missing' })
  })

  it('names the collection URL with its query', async () => {
    const { fetch } = drupal({ 'GET /jsonapi': index(), 'GET /jsonapi/node/article?page[limit]=5': () => json({ errors: [{ title: 'Forbidden' }] }, 403) })
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).getCollection('node--article', 'page[limit]=5'))
    expect(error.message).toBe(`403: Forbidden\n\nURL: ${BASE_URL}/jsonapi/node/article?page[limit]=5`)
    expect(error.druxt).toEqual({ url: '/jsonapi/node/article?page[limit]=5' })
  })

  it('carries a refused POST\'s errors and URL', async () => {
    const errors = [{ status: '422', title: 'Unprocessable Content', detail: 'title: This value should not be null.', source: { pointer: '/data/attributes/title' } }]
    const { fetch } = drupal({ 'GET /jsonapi': index(), 'POST /jsonapi/node/article': () => json({ errors }, 422) })
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).createResource({ type: 'node--article' }))
    expect(error.message).toBe(`422: Unprocessable Content\n\nURL: ${BASE_URL}/jsonapi/node/article\n\ntitle: This value should not be null.`)
    expect(error.response).toMatchObject({ status: 422, data: { errors } })
    expect(error.druxt).toEqual({ url: '/jsonapi/node/article' })
  })

  it('carries a refused PATCH\'s errors and URL', async () => {
    const errors = [{ status: '403', title: 'Forbidden', detail: 'The current user is not allowed to PATCH the selected resource.' }]
    const { fetch } = drupal({ 'GET /jsonapi': index(), 'PATCH /jsonapi/node/article/a1': () => json({ errors }, 403) })
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).updateResource({ type: 'node--article', id: 'a1' }))
    expect(error.message).toBe(`403: Forbidden\n\nURL: ${BASE_URL}/jsonapi/node/article/a1\n\n${errors[0]!.detail}`)
    expect(error.response).toMatchObject({ status: 403, url: `${BASE_URL}/jsonapi/node/article/a1`, data: { errors } })
    expect(error.druxt).toEqual({ url: '/jsonapi/node/article/a1' })
  })

  it('falls back to the request\'s message when the response has no status text', async () => {
    const { fetch } = drupal({ 'GET /jsonapi/node/article': () => new Response('{}', { status: 404 }) })
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).get('/jsonapi/node/article'))
    expect(error.message).toBe(`404: Request failed with status code 404\n\nURL: ${BASE_URL}/jsonapi/node/article`)
  })

  it('names the URL of a request that never got a response', async () => {
    const fetch = () => Promise.reject(new TypeError('fetch failed'))
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).get('/jsonapi/node/article'))
    expect(error.message).toBe(`fetch failed\n\nURL: ${BASE_URL}/jsonapi/node/article`)
    expect(error.response).toBeUndefined()
  })

  it('rejects from request() with the response, unformatted', async () => {
    const { fetch } = drupal({ 'GET /jsonapi': () => json({ errors: [{ title: 'Internal Server Error' }] }, 500) })
    const error = await rejection(new DruxtClient(BASE_URL, { fetch }).request('/jsonapi'))
    expect(error.message).toBe('Request failed with status code 500')
    expect(error.response).toMatchObject({ status: 500, url: `${BASE_URL}/jsonapi`, data: { errors: [{ title: 'Internal Server Error' }] } })
  })
})

describe('checkPermissions', () => {
  const client = new DruxtClient(BASE_URL)
  const help = 'https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module/filtering#filters-access-control'
  const omitted = (links: Record<string, unknown>): { data: JsonApiDocument<unknown> } => ({
    data: {
      data: [],
      meta: { omitted: { detail: 'Some resources have been omitted because of insufficient authorization.', links } },
    },
  })
  const item = (permission: string) => ({ href: `${BASE_URL}/jsonapi/user/user/u1`, meta: { rel: 'item', detail: `The '${permission}' permission is required.` } })

  it('passes a document that omits nothing', () => {
    expect(() => client.checkPermissions({ data: { data: [] } })).not.toThrow()
  })

  it('throws each required permission once, in the client\'s error shape, with Drupal\'s help link', () => {
    const error = thrown(() => client.checkPermissions(omitted({
      help: { href: help },
      a: item('access user profiles'),
      b: item('view unpublished content'),
      c: item('access user profiles'),
    })))
    const detail = `Required permissions:\n - access user profiles\n - view unpublished content\n\nSee ${help}`
    expect(error).toBeInstanceOf(DruxtPermissionsError)
    expect(error).toBeInstanceOf(Error)
    expect(error).toMatchObject({
      name: 'DruxtPermissionsError',
      message: `Some resources have been omitted because of insufficient authorization.\n\n${detail}`,
      permissions: ['access user profiles', 'view unpublished content'],
      help,
      response: {
        statusText: 'Some resources have been omitted because of insufficient authorization.',
        data: { errors: [{ detail }] },
      },
    })
  })

  it('leaves the help link out when Drupal sends none', () => {
    const error = thrown(() => client.checkPermissions(omitted({ a: item('access user profiles') }))) as DruxtError
    expect(error.response?.data?.errors?.[0]?.detail).toBe('Required permissions:\n - access user profiles')
  })

  it('passes omissions that name no permission', () => {
    expect(() => client.checkPermissions(omitted({ help: { href: help }, a: { href: '', meta: { detail: 'Not found.' } } }))).not.toThrow()
  })

  it('formats into an error with error()', () => {
    const error = thrown(() => client.checkPermissions(omitted({ help: { href: help }, a: item('access user profiles') }))) as DruxtError
    expect(() => client.error(error)).toThrow(`Some resources have been omitted because of insufficient authorization.\n\nRequired permissions:\n - access user profiles\n\nSee ${help}`)
  })
})
