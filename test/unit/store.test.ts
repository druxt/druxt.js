// cspell:ignore fieldsets (JSON:API's sparse fieldsets)
import { describe, expect, it, vi } from 'vitest'
import { createApp, markRaw } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { DruxtClient } from '../../packages/client/src'
import { useDruxtStore } from '../../packages/core/src/runtime/store'
import { BASE_URL, drupal, index, individual, json, requested } from './fake-drupal'

const page = { type: 'node--page', id: 'p1', attributes: { title: 'About' }, relationships: { uid: { data: { type: 'user--user', id: 'u1' } } } }
const user = { type: 'user--user', id: 'u1', attributes: { name: 'editor' } }

const storeFor = () => {
  const { fetch, calls } = drupal({
    'GET /jsonapi': index('', ['node--page', 'user--user']),
    'GET /jsonapi/node/page/p1': { data: page },
    'GET /jsonapi/node/page/p1?include=uid': { data: page, included: [user] },
  })
  const client = new DruxtClient(BASE_URL, { fetch })
  const pinia = createPinia()
  // Core's Pinia plugin gives every store the client as `this.$druxt`.
  pinia.use(() => ({ $druxt: markRaw(client) }))
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return { calls, store: useDruxtStore() }
}

describe('useDruxtStore().getResource()', () => {
  it('throws on an empty type or id, naming it, before any request', async () => {
    const { calls, store } = storeFor()
    await expect(store.getResource({ type: 'node--page', id: '' })).rejects.toThrow(TypeError)
    await expect(store.getResource({ type: 'node--page', id: '' })).rejects.toThrow('getResource() needs an id')
    await expect(store.getResource({ type: '', id: 'p1' })).rejects.toThrow('getResource() needs a type')
    expect(calls).toHaveLength(0)
  })

  it('answers a sparse request from a full request for the same resource still in flight, with no second request', async () => {
    const { calls, store } = storeFor()
    const [full, sparse] = await Promise.all([
      store.getResource({ type: 'node--page', id: 'p1' }),
      store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title' } } }),
    ])
    expect(requested(calls).filter((r) => !r.endsWith('/jsonapi'))).toEqual(['GET /jsonapi/node/page/p1'])
    expect(sparse.data?.attributes).toEqual(full.data?.attributes)
  })

  it('reads an include given as an array, as its query type allows', async () => {
    const { calls, store } = storeFor()
    const result = await store.getResource({ type: 'node--page', id: 'p1', query: { include: ['uid'] } })
    expect(requested(calls).filter((r) => !r.endsWith('/jsonapi'))).toEqual(['GET /jsonapi/node/page/p1?include=uid'])
    expect(result.included?.map((resource) => resource.id)).toEqual(['u1'])
  })

  /** A store on a fake Drupal that answers sparse fieldsets as Drupal does. */
  const sparseStoreFor = (reply = individual(page, [user])) => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index('', ['node--page', 'user--user']), 'GET /jsonapi/node/page/p1': reply })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    return { calls, store: useDruxtStore(), resources: () => requested(calls).filter((r) => !r.endsWith('/jsonapi')).map(decodeURIComponent) }
  }

  it('shares one failed request between readers with the same query, and repeats it for neither', async () => {
    const { store, resources } = sparseStoreFor(() => json({ errors: [{ status: '500', title: 'Internal Server Error' }] }, 500))
    const query = { fields: { 'node--page': 'title' } }
    const [first, second] = await Promise.all([store.getResource({ type: 'node--page', id: 'p1', query }), store.getResource({ type: 'node--page', id: 'p1', query })])
    expect(first.error?.statusCode).toBe(500)
    expect(second.error?.statusCode).toBe(500)
    expect(resources()).toEqual(['GET /jsonapi/node/page/p1?fields[node--page]=title'])
  })

  it('waits on a sparse request in flight, then asks only for the fields it lacks', async () => {
    const { store, resources } = sparseStoreFor()
    const [, both] = await Promise.all([
      store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title' } } }),
      store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title,uid' } } }),
    ])
    expect(resources()).toEqual(['GET /jsonapi/node/page/p1?fields[node--page]=title', 'GET /jsonapi/node/page/p1?fields[node--page]=uid'])
    expect(both.data?.attributes).toEqual({ title: 'About' })
    expect(Object.keys(both.data?.relationships || {})).toEqual(['uid'])
  })

  it('does not wait on a request in flight when the store already holds what it asks for', async () => {
    const { store, resources } = sparseStoreFor()
    await store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title' } } })
    const pending = store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'uid' } } })
    const held = store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title' } } })
    // Answered from the store before the request in flight for another field settles.
    expect(await Promise.race([held.then(() => 'held'), pending.then(() => 'pending')])).toBe('held')
    expect((await held).data?.attributes).toEqual({ title: 'About' })
    await pending
    expect(resources()).toHaveLength(2)
  })

  it('reports a refused or missing resource as error, with no data, and does not store it', async () => {
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--page']),
      'GET /jsonapi/node/page/denied': () => json({ errors: [{ status: '403', title: 'Forbidden', detail: 'Secret backend detail.' }] }, 403),
      'GET /jsonapi/node/page/p1': { data: page },
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    const denied = await store.getResource({ type: 'node--page', id: 'denied' })
    expect(denied.error?.statusCode).toBe(403)
    expect(denied.error?.message).toBe('Forbidden')
    expect(denied.error?.message).not.toContain('http')
    expect(JSON.stringify(denied.error)).not.toContain('Secret')
    expect(denied.data).toBeUndefined()
    const missing = await store.getResource({ type: 'node--page', id: 'gone' })
    expect(missing.error?.statusCode).toBe(404)
    expect(missing.data).toBeUndefined()
    expect(store.resources['node--page']?.denied).toBeUndefined()
    expect((await store.getResource({ type: 'node--page', id: 'p1' })).error).toBeUndefined()
  })

  it('returns data with no error once a later request for the same id succeeds', async () => {
    let allowed = false
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--page']),
      'GET /jsonapi/node/page/p1': () => allowed ? json({ data: page }) : json({ errors: [{ title: 'Forbidden' }] }, 403),
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    expect((await store.getResource({ type: 'node--page', id: 'p1' })).error?.statusCode).toBe(403)
    allowed = true
    const retry = await store.getResource({ type: 'node--page', id: 'p1' })
    expect(retry.error).toBeUndefined()
    expect(retry.data).toEqual(page)
  })

  it('loads a resource with its includes', async () => {
    const { calls, store } = storeFor()
    const resource = await store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })
    expect(resource.data).toEqual(page)
    expect(resource.included).toEqual([user])
    expect(requested(calls)).toContain('GET /jsonapi/node/page/p1?include=uid')
  })
})

describe('useDruxtStore() merging', () => {
  it('merges a resource into the stored one: the newer value wins, arrays are replaced and null overrides', () => {
    const { store } = storeFor()
    const first = {
      type: 'node--page',
      id: 'p2',
      attributes: { title: 'Old', tags: ['a', 'b'], body: { value: 'Text', format: 'basic_html' }, summary: 'Kept' },
      relationships: { uid: { data: { type: 'user--user', id: 'u1' } } },
    }
    const second = {
      type: 'node--page',
      id: 'p2',
      attributes: { title: 'New', tags: ['c'], body: { value: 'Changed' } },
      relationships: { uid: { data: null } },
    }
    store.addResource({ resource: { data: first as never } })
    store.addResource({ resource: { data: second as never } })
    const { data } = store.resources['node--page']!.p2!.undefined!
    expect(data.attributes).toEqual({ title: 'New', tags: ['c'], body: { value: 'Changed', format: 'basic_html' }, summary: 'Kept' })
    expect(data.relationships).toEqual({ uid: { data: null } })
  })

  it('does not share nested objects with the resource it was given', () => {
    const { store } = storeFor()
    const resource = { data: { type: 'node--page', id: 'p3', attributes: { body: { value: 'Text' } } } }
    store.addResource({ resource: resource as never })
    resource.data.attributes.body.value = 'Mutated'
    expect(store.resources['node--page']!.p3!.undefined!.data.attributes).toEqual({ body: { value: 'Text' } })
  })

  it('replaces a stored collection\'s data, not appending to it', () => {
    const { store } = storeFor()
    const collection = (ids: string[]) => ({ data: ids.map((id) => ({ type: 'node--page', id })), links: { self: { href: `${BASE_URL}/jsonapi/node/page` } } })
    store.addCollection({ type: 'node--page', hash: '_default', collection: collection(['p1', 'p2']) as never })
    store.addCollection({ type: 'node--page', hash: '_default', collection: collection(['p3']) as never })
    expect(store.collections['node--page']!._default!.undefined!.data).toEqual([{ type: 'node--page', id: 'p3' }])
  })

  it('stores a collection under a stable key for its query, ignoring fields and includes', async () => {
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--page']),
      'GET /jsonapi/node/page?filter%5Bstatus%5D=1': { data: [], links: { self: { href: `${BASE_URL}/jsonapi/node/page?filter%5Bstatus%5D=1` } } },
      'GET /jsonapi/node/page?filter%5Bstatus%5D=1&fields%5Bnode--page%5D=title': { data: [], links: { self: { href: `${BASE_URL}/jsonapi/node/page?filter%5Bstatus%5D=1` } } },
    })
    const client = new DruxtClient(BASE_URL, { fetch })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(client) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    await store.getCollection({ type: 'node--page', query: { filter: { status: '1' } } })
    await store.getCollection({ type: 'node--page', query: { filter: { status: '1' }, fields: { 'node--page': 'title' } } })
    const keys = Object.keys(store.collections['node--page']!)
    expect(keys).toHaveLength(1)
    // ohash's digest() of the query's JSON, pinned so a change of format is seen.
    // cspell:disable-next-line
    expect(keys[0]).toBe('vVRjH5QpwekARUuNPy9PHBwxO9fJWTqatv9NvCik2wQ')
    store.flushCollection({ type: 'node--page', query: { filter: { status: '1' } } })
    expect(store.collections['node--page']).toEqual({})
  })
})

describe('useDruxtStore().peekResource() and peekResources()', () => {
  it('reads a held resource under its prefix with no request, and undefined for one the store does not hold', async () => {
    const { calls, store } = storeFor()
    await store.getResource({ type: 'node--page', id: 'p1', query: 'include=uid' })
    const before = calls.length
    expect(store.peekResource({ type: 'node--page', id: 'p1' })).toMatchObject({ id: 'p1', attributes: { title: 'About' } })
    // An included resource is held too.
    expect(store.peekResource({ type: 'user--user', id: 'u1' })).toMatchObject({ attributes: { name: 'editor' } })
    expect(store.peekResource({ type: 'node--page', id: 'p1', prefix: 'es' })).toBeUndefined()
    expect(store.peekResource({ type: 'node--page', id: 'missing' })).toBeUndefined()
    expect(calls).toHaveLength(before)
  })

  it('lists every held resource of a type, under the prefix or else under the one it is held under', () => {
    const { store } = storeFor()
    store.addResource({ prefix: 'en', resource: { data: { type: 'user--user', id: 'u1', attributes: { name: 'English' } } as never } })
    store.addResource({ prefix: 'es', resource: { data: { type: 'user--user', id: 'u1', attributes: { name: 'Spanish' } } as never } })
    store.addResource({ prefix: 'es', resource: { data: { type: 'user--user', id: 'u2', attributes: { name: 'Only Spanish' } } as never } })
    expect(store.peekResources({ type: 'user--user', prefix: 'en' }).map((user) => user.attributes?.name)).toEqual(['English', 'Only Spanish'])
    expect(store.peekResources({ type: 'node--page' })).toEqual([])
  })
})

describe('useDruxtStore() seeding and links', () => {
  const pageWithLinks = {
    type: 'node--page',
    id: 'p1',
    links: { self: { href: `${BASE_URL}/jsonapi/node/page/p1` } },
    attributes: { title: 'About' },
    relationships: { uid: { data: { type: 'user--user', id: 'u1' }, links: { self: { href: `${BASE_URL}/jsonapi/node/page/p1/relationships/uid` }, related: { href: `${BASE_URL}/jsonapi/node/page/p1/uid` } } } },
  }

  /** A store on a fake Drupal that answers sparse fieldsets, with its resource requests. */
  const sparseSite = () => {
    const { fetch, calls } = drupal({
      'GET /jsonapi': index('', ['node--page', 'user--user', 'media--image', 'file--file', 'taxonomy_term--tags']),
      'GET /jsonapi/node/page/p1': individual({ ...page, attributes: { title: 'About', body: { value: 'Body' } } }, [user]),
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    return { store: useDruxtStore(), pinia, resources: () => requested(calls).filter((r) => !r.endsWith('/jsonapi')).map(decodeURIComponent) }
  }

  it('records a resource seeded as partial by its own fields: a read of another field fetches, a seeded one does not', async () => {
    const { store, resources } = sparseSite()
    // A view's row: a bare self link, and only the fields the view selected.
    store.addResource({ resource: { data: { type: 'node--page', id: 'p1', links: { self: { href: `${BASE_URL}/jsonapi/node/page/p1` } }, attributes: { title: 'About' } } as never }, partial: true })
    expect((await store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title' } } })).data?.attributes?.title).toBe('About')
    expect(resources()).toEqual([])
    const body = await store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'body' } } })
    expect(resources()).toEqual(['GET /jsonapi/node/page/p1?fields[node--page]=body'])
    expect(body.data?.attributes).toEqual({ title: 'About', body: { value: 'Body' } })
  })

  it('stores a partial resource with no self link, keyed by its type and id', async () => {
    const { store, resources } = sparseSite()
    store.addResource({ resource: { data: { type: 'node--page', id: 'p1', attributes: { title: 'About' } } as never }, partial: true })
    expect(store.peekResource({ type: 'node--page', id: 'p1' })?.attributes).toEqual({ title: 'About' })
    await store.getResource({ type: 'node--page', id: 'p1' })
    expect(resources()).toEqual(['GET /jsonapi/node/page/p1'])
  })

  it('seeds a collection\'s rows as partial, and its includes at any depth as full, whatever its self link\'s query', async () => {
    const { store, resources } = sparseSite()
    const media = { type: 'media--image', id: 'm1', attributes: { name: 'Borscht' }, relationships: { field_media_image: { data: { type: 'file--file', id: 'f1' } } } }
    const file = { type: 'file--file', id: 'f1', attributes: { uri: { url: '/files/borscht.jpg' } } }
    const term = { type: 'taxonomy_term--tags', id: 't1', attributes: { name: 'Soup', path: { alias: '/tags/soup' } } }
    const row = { type: 'node--page', id: 'p1', attributes: { title: 'About' }, relationships: { field_media: { data: { type: 'media--image', id: 'm1' } }, field_tags: { data: [{ type: 'taxonomy_term--tags', id: 't1' }] } } }
    store.addCollection({ type: 'node--page', hash: 'view', partial: true, collection: { data: [row], included: [media, file, term], links: { self: { href: `${BASE_URL}/jsonapi/views/recipes/page_1?include=field_media.field_media_image,field_tags&fields[file--file]=uri&fields[taxonomy_term--tags]=name` } } } as never })

    // The second-level include, through the first, and a label formatter's sparse read of a term: from the store.
    const read = await store.getResource({ type: 'media--image', id: 'm1', query: { include: 'field_media_image' } })
    expect(read.included).toEqual([file])
    expect((await store.getResource({ type: 'file--file', id: 'f1' })).data).toEqual(file)
    expect((await store.getResource({ type: 'taxonomy_term--tags', id: 't1', query: { fields: { 'taxonomy_term--tags': 'name,path' } } })).data).toEqual(term)
    expect(resources()).toEqual([])
    // The row is partial: a field the view did not select is fetched.
    await store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'body' } } })
    expect(resources()).toEqual(['GET /jsonapi/node/page/p1?fields[node--page]=body'])
  })

  it('keeps no backend link on a resource, its relationships or a collection, so the payload names no backend', async () => {
    const { store } = sparseSite()
    await store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })
    store.addResource({ resource: { data: pageWithLinks as never, links: { self: { href: `${BASE_URL}/jsonapi/node/page/p1` } }, jsonapi: { version: '1.1', meta: { links: { self: { href: 'https://jsonapi.org/format/1.1/' } } } } } as never })
    store.addCollection({ type: 'node--page', hash: '_default', collection: { data: [pageWithLinks], included: [{ ...user, links: { self: { href: `${BASE_URL}/jsonapi/user/user/u1` } } }], links: { self: { href: `${BASE_URL}/jsonapi/node/page` }, next: { href: `${BASE_URL}/jsonapi/node/page?page%5Boffset%5D=50` } } } as never })
    const payload = JSON.stringify(store.$state)
    expect(payload).not.toContain(BASE_URL)
    expect(payload).not.toContain('"links"')
    // Positive control: the content is there.
    expect(payload).toContain('About')
    expect(store.peekResource({ type: 'node--page', id: 'p1' })?.relationships?.uid).toEqual({ data: { type: 'user--user', id: 'u1' } })
  })

  it('keeps what Drupal omitted, as its reason and the types and ids, without the links that name the backend', () => {
    const { store } = sparseSite()
    const omitted = { detail: 'Some resources have been omitted because of insufficient authorization.', links: { help: { href: 'https://www.drupal.org/docs/8/modules/json-api/filtering' }, 'item--a': { href: `${BASE_URL}/en/jsonapi/taxonomy_term/tags/t9`, meta: { rel: 'item', detail: 'The \'access content\' permission is required.' } } } }
    store.addResource({ resource: { data: { type: 'node--page', id: 'p1', attributes: { title: 'About' } }, meta: { omitted } } as never })
    store.addCollection({ type: 'node--page', hash: '_default', collection: { data: [{ type: 'node--page', id: 'p1' }], meta: { count: 1, omitted } } as never })
    const payload = JSON.stringify(store.$state)
    expect(payload).not.toContain(BASE_URL)
    expect(payload).not.toContain('drupal.org')
    const expected = { detail: omitted.detail, resources: [{ type: 'taxonomy_term--tags', id: 't9' }] }
    expect(store.resources['node--page']!.p1!.undefined!.meta).toEqual({ omitted: expected })
    expect(store.collections['node--page']!._default!.undefined!.meta).toEqual({ count: 1, omitted: expected })
  })

  it('reads what Drupal omitted against the client\'s own JSON:API path, and gives it through peekMeta()', () => {
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { endpoint: '/api', fetch: drupal({}).fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    const omitted = { detail: 'Denied.', links: { 'item--a': { href: `${BASE_URL}/en/api/taxonomy_term/tags/t9` } } }
    store.addResource({ resource: { data: { type: 'node--page', id: 'p1', attributes: {} }, meta: { omitted } } as never, prefix: 'en' })
    expect(store.peekMeta({ type: 'node--page', id: 'p1', prefix: 'en' })).toEqual({ omitted: { detail: 'Denied.', resources: [{ type: 'taxonomy_term--tags', id: 't9' }] } })
    expect(store.peekMeta({ type: 'node--page', id: 'p1' })).toBeUndefined()
  })

  it('reads no include Drupal already denied when it answers a stored resource\'s includes', async () => {
    const { store, resources } = sparseSite()
    const omitted = { detail: 'Denied.', links: { 'item--a': { href: `${BASE_URL}/jsonapi/user/user/u1` } } }
    store.addResource({ resource: { data: { ...page, attributes: { title: 'About' } }, meta: { omitted } } as never })
    await store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid', fields: { 'node--page': 'title,uid' } } })
    expect(resources().filter((r) => r.includes('/user/user/'))).toEqual([])
  })

  /** A store on a Drupal that denies the page's author until `grant()`. */
  const deniedSite = () => {
    let granted = false
    const omitted = { detail: 'Denied.', links: { 'item--a': { href: `${BASE_URL}/jsonapi/user/user/u1` } } }
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--page', 'user--user']),
      'GET /jsonapi/node/page/p1': () => json(granted ? { data: page, included: [user] } : { data: page, meta: { omitted } }),
      'GET /jsonapi/user/user/u1': () => json({ data: user }),
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    const authors = async () => (await store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })).included?.map((resource) => resource.id) ?? []
    return { store, authors, grant: () => { granted = true } }
  }

  it('forgets what Drupal denied when the cache is cleared, so an include since granted is answered from the store too', async () => {
    const { store, authors, grant } = deniedSite()
    expect(await authors()).toEqual([])
    grant()
    store.clearCache()
    expect(await authors()).toEqual(['u1'])
    // The same read again, from the store.
    expect(await authors()).toEqual(['u1'])
  })

  it('forgets a denial once the resource itself is stored, and keeps it through a flush of another resource', async () => {
    const { store, authors } = deniedSite()
    expect(await authors()).toEqual([])
    store.flushResource({ type: 'node--article' })
    expect(await authors()).toEqual([])
    store.addResource({ resource: { data: user } as never })
    expect(await authors()).toEqual(['u1'])
  })

  it('returns the stored shape, without links, from a read a flush overtook', async () => {
    const { store } = sparseSite()
    const read = store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })
    store.flushResource({})
    const result = await read
    expect(result.data?.attributes?.title).toBe('About')
    expect(JSON.stringify(result)).not.toContain(BASE_URL)
    expect(result).not.toHaveProperty('links')
  })

  // Drupal leaves `included` out of a document that includes nothing. A read from the store has the same shape, so
  // a page rendered on the server from a fresh read hydrates from a stored one without a difference.
  it('leaves included out of a read that includes nothing, fresh or stored', async () => {
    const lone = { type: 'node--page', id: 'p8', attributes: { title: 'Alone' }, relationships: { field_tags: { data: [] } } }
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--page', 'taxonomy_term--tags']),
      'GET /jsonapi/node/page/p8': individual(lone as never, []),
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    const fresh = await store.getResource({ type: 'node--page', id: 'p8', query: { include: 'field_tags' } })
    const stored = await store.getResource({ type: 'node--page', id: 'p8', query: { include: 'field_tags' } })
    expect('included' in fresh).toBe(false)
    expect('included' in stored).toBe(false)
    expect(JSON.stringify(stored)).toBe(JSON.stringify(fresh))
  })

  // Drupal takes a UUID a client supplies, and checks it within the entity type alone.
  it('tells two included resources that share an id apart by their type', async () => {
    const media = { type: 'media--image', id: 'shared', attributes: { name: 'Borscht' } }
    const term = { type: 'taxonomy_term--tags', id: 'shared', attributes: { name: 'Soup' } }
    const both = { type: 'node--page', id: 'p9', attributes: { title: 'Both' }, relationships: { field_media: { data: { type: 'media--image', id: 'shared' } }, field_tags: { data: [{ type: 'taxonomy_term--tags', id: 'shared' }] } } }
    const { fetch } = drupal({
      'GET /jsonapi': index('', ['node--page', 'media--image', 'taxonomy_term--tags']),
      'GET /jsonapi/node/page/p9': individual(both as never, [media, term] as never),
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const read = await useDruxtStore().getResource({ type: 'node--page', id: 'p9', query: { include: 'field_media,field_tags' } })
    expect(read.included?.map((o) => [o.type, o.attributes?.name])).toEqual([['media--image', 'Borscht'], ['taxonomy_term--tags', 'Soup']])
  })

  it('returns an overtaken read\'s own includes, not what a later read stored', async () => {
    const { store } = sparseSite()
    const read = store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })
    store.flushResource({})
    store.addResource({ resource: { data: { type: 'user--user', id: 'u1', attributes: { display_name: 'Renamed since' } } as never } })
    const result = await read
    expect(result.included).toEqual([user])
    expect(JSON.stringify(result)).not.toContain(BASE_URL)
  })

  // The read waits for its includes. A flush in that wait empties the store, so the fields it holds decide nothing.
  it('asks for every field it was asked for when a flush empties the store while it waits for its includes', async () => {
    const { fetch, calls } = drupal({
      'GET /jsonapi': index('', ['node--page', 'user--user']),
      'GET /jsonapi/node/page/p1': individual({ ...page, attributes: { title: 'About', body: { value: 'Body' } } }, [user]),
      'GET /jsonapi/user/user/u1': individual(user),
    })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(new DruxtClient(BASE_URL, { fetch })) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    store.addResource({ resource: { data: { type: 'node--page', id: 'p1', attributes: { title: 'About' }, relationships: { uid: { data: { type: 'user--user', id: 'u1' } } } } as never }, partial: true })
    const read = store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid', fields: { 'node--page': 'title,uid,body' } } })
    store.flushResource({})
    const result = await read
    const asked = requested(calls).map(decodeURIComponent).filter((r) => r.includes('/node/page/p1'))
    expect(asked).toHaveLength(1)
    expect(asked[0]).toContain('fields[node--page]=title,uid,body')
    expect(Object.keys(result.data?.attributes || {}).sort()).toEqual(['body', 'title'])
  })

  // A restored store has no record of what Drupal denied, but the parent's own `meta.omitted` still names it.
  it('asks for no include that a restored parent lists as omitted, and reads one that is stored', async () => {
    const seeded = sparseSite()
    const parent = { type: 'node--page', id: 'p1', attributes: { title: 'About' }, relationships: { uid: { data: { type: 'user--user', id: 'u1' } } } }
    seeded.store.addResource({ resource: { data: parent as never, meta: { omitted: { detail: 'Some resources have been omitted because of insufficient authorization.', links: { 'item--a': { href: `${BASE_URL}/jsonapi/user/user/u1`, meta: { detail: 'Denied.' } } } } } } as never })
    const state = JSON.parse(JSON.stringify(seeded.store.$state))
    expect(JSON.stringify(state)).toContain('"omitted"')

    const restored = sparseSite()
    restored.store.$patch(state)
    await restored.store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })
    await restored.store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })
    expect(restored.resources().filter((r) => r.includes('/user/'))).toEqual([])
    restored.store.addResource({ resource: { data: user as never } })
    expect((await restored.store.getResource({ type: 'node--page', id: 'p1', query: { include: 'uid' } })).included).toEqual([user])
  })

  it('tells partial from full after the payload is restored into a new store', async () => {
    const seeded = sparseSite()
    seeded.store.addResource({ resource: { data: { type: 'node--page', id: 'p1', attributes: { title: 'About' } } as never }, partial: true })
    seeded.store.addResource({ resource: { data: { type: 'user--user', id: 'u1', attributes: { name: 'editor' } } as never } })
    const state = JSON.parse(JSON.stringify(seeded.store.$state))

    const restored = sparseSite()
    restored.store.$patch(state)
    await restored.store.getResource({ type: 'user--user', id: 'u1', query: { fields: { 'user--user': 'name,mail' } } })
    expect(restored.resources()).toEqual([])
    await restored.store.getResource({ type: 'node--page', id: 'p1', query: { fields: { 'node--page': 'title,body' } } })
    expect(restored.resources()).toEqual(['GET /jsonapi/node/page/p1?fields[node--page]=body'])
  })
})

describe('useDruxtStore() bypassCache and the process cache', () => {
  const recipe = { type: 'node--recipe', id: 'r1', attributes: { title: 'Quiche' }, relationships: { field_media_image: { data: { type: 'media--image', id: 'm1' } } } }
  const media = { type: 'media--image', id: 'm1', attributes: { name: 'Fresh media' } }

  /** A store whose client answers the recipe, and records the read options its reads were given. */
  const bypassStoreFor = (answers: Array<() => Promise<Response>> = []) => {
    const { fetch, calls } = drupal({
      'GET /jsonapi': index('', ['node--recipe', 'media--image']),
      'GET /jsonapi/node/recipe/r1': individual(recipe, [media]),
    })
    let turn = 0
    const deferred = async (input: string, init?: RequestInit) => (answers.length && !String(input).endsWith('/jsonapi') ? answers[turn++ % answers.length]!() : fetch(input, init))
    const client = new DruxtClient(BASE_URL, { fetch: deferred })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(client) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    return { calls, client, store: useDruxtStore() }
  }

  it('a bypass reaches the client, so the server process cache is skipped too, and is its own request', async () => {
    const { client, store } = bypassStoreFor()
    const read = vi.spyOn(client, 'getResource')
    const list = vi.spyOn(client, 'getCollection')
    await store.getResource({ type: 'node--recipe', id: 'r1' })
    await store.getResource({ type: 'node--recipe', id: 'r1', bypassCache: true })
    expect(read).toHaveBeenCalledTimes(2)
    expect(read.mock.calls[0]![4]).toEqual({ bypassCache: false })
    expect(read.mock.calls[1]![4]).toEqual({ bypassCache: true })
    await store.getCollection({ type: 'node--recipe', bypassCache: true }).catch(() => undefined)
    expect(list.mock.calls[0]![3]).toEqual({ bypassCache: true })
  })

  it('an ordinary request that resolves after a bypass does not replace its answer', async () => {
    // An ordinary read and a bypass in flight at once, answered in the opposite order to the one they started in.
    const pending: Array<() => void> = []
    const answer = (title: string) => () => new Promise<Response>((resolve) => pending.push(() => resolve(json({ data: { ...recipe, attributes: { title } } }))))
    const { store } = bypassStoreFor([answer('Stale'), answer('Fresh')])
    const ordinary = store.getResource({ type: 'node--recipe', id: 'r1' })
    const bypass = store.getResource({ type: 'node--recipe', id: 'r1', bypassCache: true })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(pending).toHaveLength(2)
    pending[1]!()
    expect((await bypass).data?.attributes?.title).toBe('Fresh')
    pending[0]!()
    await ordinary
    expect(store.peekResource({ type: 'node--recipe', id: 'r1' })?.attributes?.title).toBe('Fresh')
  })

  it('a bypass returns only the includes the fresh response has', async () => {
    const { store } = bypassStoreFor()
    // A stored copy that still relates to media Drupal has since removed from the recipe.
    store.addResource({ resource: { data: { type: 'media--image', id: 'removed', attributes: {} } as never } })
    store.addResource({ resource: { data: { ...recipe, relationships: { field_media_image: { data: { type: 'media--image', id: 'removed' } } } } as never } })
    const resource = await store.getResource({ type: 'node--recipe', id: 'r1', query: { include: 'field_media_image' }, bypassCache: true })
    expect((resource.included || []).map((item) => item.id)).toEqual(['m1'])
  })
})

describe('useDruxtStore() rebuilding includes from stored resources', () => {
  const fields = { 'node--page': 'title,field_content', 'paragraph--text': 'field_text', 'paragraph--image': 'field_media', 'media--image': 'name' }
  const seeded = () => {
    const { fetch, calls } = drupal({ 'GET /jsonapi': index('', ['node--page', 'paragraph--text', 'paragraph--image', 'media--image']) })
    const client = new DruxtClient(BASE_URL, { fetch })
    const pinia = createPinia()
    pinia.use(() => ({ $druxt: markRaw(client) }))
    createApp({}).use(pinia)
    setActivePinia(pinia)
    const store = useDruxtStore()
    const add = (data: Record<string, unknown>) => store.addResource({ resource: { data } as never, query: { fields: { [data.type as string]: fields[data.type as keyof typeof fields] } } })
    add({ type: 'node--page', id: 'n1', attributes: { title: 'Page' }, relationships: { field_content: { data: [{ type: 'paragraph--text', id: 't1' }, { type: 'paragraph--image', id: 'i1' }] } } })
    add({ type: 'paragraph--text', id: 't1', attributes: { field_text: 'Text' } })
    add({ type: 'paragraph--image', id: 'i1', relationships: { field_media: { data: { type: 'media--image', id: 'm1' } } } })
    add({ type: 'media--image', id: 'm1', attributes: { name: 'Image' } })
    return { calls, client, store }
  }

  it('takes from each related resource only the includes its type has, and asks a flushed one for none its fields lack', async () => {
    const { client, store } = seeded()
    const read = vi.spyOn(client, 'getResource').mockRejectedValue(new Error('Drupal answers 400'))
    const query = { include: 'field_content,field_content.field_media', fields }
    const page = await store.getResource({ type: 'node--page', id: 'n1', query })
    // Everything is in the store, so nothing is fetched, and the text paragraph is never asked for a field_media it lacks.
    expect(read).not.toHaveBeenCalled()
    expect((page.included || []).map(({ type, id }) => `${type}:${id}`).sort()).toEqual(['media--image:m1', 'paragraph--image:i1', 'paragraph--text:t1'])

    // A flushed text paragraph is fetched again, without the include its listed fields don't name.
    store.flushResource({ type: 'paragraph--text', id: 't1' })
    read.mockResolvedValue({ data: { type: 'paragraph--text', id: 't1', attributes: { field_text: 'Text' } } } as never)
    await store.getResource({ type: 'node--page', id: 'n1', query })
    expect(read).toHaveBeenCalledTimes(1)
    const [type, id, sent] = read.mock.calls[0]!
    expect([type, id]).toEqual(['paragraph--text', 't1'])
    expect(decodeURIComponent((sent as { getQueryString: () => string }).getQueryString())).not.toMatch(/include=/)
  })

  it('rebuilds the relationships along a nested include path', async () => {
    const { client, store } = seeded()
    const read = vi.spyOn(client, 'getResource').mockRejectedValue(new Error('Drupal answers 400'))
    const page = await store.getResource({ type: 'node--page', id: 'n1', query: { include: 'field_content.field_media', fields } })
    expect(read).not.toHaveBeenCalled()
    expect((page.included || []).map(({ type, id }) => `${type}:${id}`).sort()).toEqual(['media--image:m1', 'paragraph--image:i1', 'paragraph--text:t1'])
  })
})
