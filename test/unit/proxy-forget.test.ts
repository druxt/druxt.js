import { describe, expect, it } from 'vitest'
import { writtenResource } from '../../packages/core/src/runtime/server/utils/proxy'

// What an editor's write through the proxy makes stale in the server's content cache.

const key = (url: string) => JSON.stringify(['["https://drupal.test","/jsonapi"]', url])
const RECIPE = '8aa2ce58-4b7f-4190-8c3d-e81b567efe85'

describe('writtenResource()', () => {
  it('names the written resource\'s documents, its type\'s collections and the route lookups, under any prefix or query', () => {
    const stale = writtenResource(`/es/jsonapi/node/recipe/${RECIPE}`, '/jsonapi')!
    expect(stale(key(`https://drupal.test/jsonapi/node/recipe/${RECIPE}?include=field_tags`))).toBe(true)
    expect(stale(key(`https://drupal.test/es/jsonapi/node/recipe/${RECIPE}`))).toBe(true)
    expect(stale(key('https://drupal.test/jsonapi/node/recipe?page%5Blimit%5D=10'))).toBe(true)
    expect(stale(key('https://drupal.test/en/jsonapi/node/recipe'))).toBe(true)
    expect(stale(key('https://drupal.test/router/translate-path?path=/recipes/borscht'))).toBe(true)
    // Another type, and another recipe's document, stay.
    expect(stale(key('https://drupal.test/jsonapi/node/article/other'))).toBe(false)
    expect(stale(key('https://drupal.test/jsonapi/node/recipe/00000000-0000-4000-8000-000000000001'))).toBe(false)
    expect(stale('not json')).toBe(false)
  })

  // A response read with an include may hold the written resource in its `included`, which its URL does not name.
  it('names every response read with an include for a write to one resource, and not for a new one', () => {
    const stale = writtenResource('/jsonapi/user/user/00000000-0000-4000-8000-000000000002', '/jsonapi')!
    expect(stale(key(`https://drupal.test/jsonapi/node/article/${RECIPE}?include=uid`))).toBe(true)
    expect(stale(key('https://drupal.test/es/jsonapi/node/article?page%5Blimit%5D=10&include=uid%2Cfield_tags'))).toBe(true)
    expect(stale(key(`https://drupal.test/jsonapi/node/article/${RECIPE}?fields%5Bnode--article%5D=title`))).toBe(false)
    // Drupal reads an encoded key as the key, and one that only ends the same is another key.
    expect(stale(key(`https://drupal.test/jsonapi/node/article/${RECIPE}?%69nclude=uid`))).toBe(true)
    expect(stale(key(`https://drupal.test/jsonapi/node/article/${RECIPE}?noinclude=uid#include=uid`))).toBe(false)
    const created = writtenResource('/jsonapi/user/user', '/jsonapi')!
    expect(created(key(`https://drupal.test/jsonapi/node/article/${RECIPE}?include=uid`))).toBe(false)
  })

  it('names a type\'s collections for a POST to the collection, and nothing for a path outside the JSON:API', () => {
    const created = writtenResource('/jsonapi/node/recipe', '/jsonapi')!
    expect(created(key('https://drupal.test/jsonapi/node/recipe?sort=-created'))).toBe(true)
    expect(created(key('https://drupal.test/jsonapi/node/recipe/any'))).toBe(false)
    expect(created(key('https://drupal.test/jsonapi/node/recipes'))).toBe(false)
    expect(writtenResource('/api/_druxt/auth/token', '/jsonapi')).toBeUndefined()
    expect(writtenResource('/jsonapi/node', '/jsonapi')).toBeUndefined()
  })

  // Drupal gets the path as a URL resolves it, so the write is to that resource.
  it('reads the written path as a URL resolves it, so a dot segment is never the resource', () => {
    for (const written of [`/jsonapi/node/recipe/./${RECIPE}`, `/jsonapi/node/article/../recipe/${RECIPE}`, `/jsonapi/node/recipe/%2e/${RECIPE}?x=1`]) {
      const stale = writtenResource(written, '/jsonapi')!
      expect(stale(key(`https://drupal.test/jsonapi/node/recipe/${RECIPE}`)), written).toBe(true)
      expect(stale(key('https://drupal.test/jsonapi/node/recipe')), written).toBe(true)
      // A dot is in every absolute URL. It names no resource.
      expect(stale(key('https://drupal.test/jsonapi/node/article/other')), written).toBe(false)
    }
  })

  // A Views result names no entity, so any accepted write may change any listing: every one goes, under any prefix.
  it('names every Views result, under any prefix or query, for a write to any resource, and no other type\'s entity', () => {
    for (const written of [`/jsonapi/taxonomy_term/tags/${RECIPE}`, '/es/jsonapi/node/article', `/jsonapi/media/image/${RECIPE}`]) {
      const stale = writtenResource(written, '/jsonapi')!
      expect(stale(key('https://drupal.test/jsonapi/views/recipes/page_1')), written).toBe(true)
      expect(stale(key('https://drupal.test/es/jsonapi/views/frontpage/feed_1?page=1')), written).toBe(true)
      expect(stale(key('https://drupal.test/jsonapi/node/page/00000000-0000-4000-8000-000000000001')), written).toBe(false)
      expect(stale(key('https://drupal.test/jsonapi/node/views')), written).toBe(false)
    }
  })
})
