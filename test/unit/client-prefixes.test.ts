import { describe, expect, it } from 'vitest'
import { DruxtClient } from '../../packages/client/src'
import { BASE_URL, drupal, index, json } from './fake-drupal'

/** A Drupal serving Spanish under /spanish and English unprefixed, as `language.negotiation` may configure it. */
const site = () => drupal({
  'GET /jsonapi': index('', ['node--article']),
  'GET /spanish/jsonapi': index('/spanish', ['node--article']),
  'GET /fr/jsonapi': index('/fr', ['node--article']),
  'GET /jsonapi/node/article': json({ data: [] }),
  'GET /spanish/jsonapi/node/article': json({ data: [] }),
  'GET /fr/jsonapi/node/article': json({ data: [] }),
})

const paths = (calls: Array<{ url: string }>) => calls.map((call) => new URL(call.url, BASE_URL).pathname)

describe('a client with the languages\' prefixes', () => {
  it('reads a langcode under its configured prefix, the default language unprefixed, and an unknown langcode as itself', async () => {
    const fake = site()
    const client = new DruxtClient(BASE_URL, { fetch: fake.fetch, prefixes: { en: '', es: 'spanish' } })
    await client.getCollection('node--article', undefined, 'es')
    await client.getCollection('node--article', undefined, 'en')
    await client.getCollection('node--article', undefined, 'fr')
    expect(paths(fake.calls)).toEqual(['/spanish/jsonapi', '/spanish/jsonapi/node/article', '/jsonapi', '/jsonapi/node/article', '/fr/jsonapi', '/fr/jsonapi/node/article'])
    expect(client.urlPrefix('es')).toBe('spanish')
    expect(client.urlPrefix('en')).toBe('')
    expect(client.urlPrefix()).toBe('')
  })

  it('takes a prefix given as such, and a langcode as the prefix with no map, as before', async () => {
    const fake = site()
    const client = new DruxtClient(BASE_URL, { fetch: fake.fetch })
    await client.getCollection('node--article', undefined, 'fr')
    expect(paths(fake.calls)).toEqual(['/fr/jsonapi', '/fr/jsonapi/node/article'])
    const mapped = new DruxtClient(BASE_URL, { fetch: fake.fetch, prefixes: { es: 'spanish' } })
    expect(mapped.urlPrefix('spanish')).toBe('spanish')
  })
})
