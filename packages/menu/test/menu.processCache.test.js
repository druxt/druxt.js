import { DruxtMenu } from '../src/menu'

const baseUrl = 'https://demo-api.druxtjs.org'

// A stub of the process cache that DruxtClient.processCache('menu') returns.
const store = new Map()
// As the real cache does, a write that may not be kept removes the earlier entry.
const handle = { get: (key) => store.get(key), set: (key, value, seconds) => { if (seconds > 0) store.set(key, value); else store.delete(key) } }

// Each server request gets its own client. `processCache` is null when the
// request carries credentials or the cache is off, and absent on an older druxt.
let menuCalls = 0
// `lifetimes` is the Cache-Control lifetime of each page of the menu, as the client reads it.
const requestMenu = (processCache = () => handle, lifetimes = [300]) => {
  const druxtClient = {
    indexKey: 'backend',
    options: { endpoint: '/jsonapi' },
    index: {},
    async getIndex(resource, prefix) { this.index[prefix] = this.index[prefix] || {} },
    async getCollectionAll() {
      menuCalls += 1
      return lifetimes.map((lifetime) => ({ lifetime, data: [{ id: 'a', attributes: { url: '/', title: 'Home' } }] }))
    },
    cacheLifetime: (collection) => (collection || {}).lifetime || 0,
  }
  if (processCache) druxtClient.processCache = jest.fn(processCache)
  return new DruxtMenu(baseUrl, { druxtClient, menu: { jsonApiMenuItems: true } })
}

describe('DruxtMenu process cache', () => {
  beforeEach(() => {
    store.clear()
    menuCalls = 0
  })

  test('a menu survives between requests', async () => {
    const menu = requestMenu()
    const first = await menu.get('main')
    expect(menu.druxt.processCache).toHaveBeenCalledWith('menu')
    const second = await requestMenu().get('main')
    expect(menuCalls).toBe(1)
    expect(second).toStrictEqual(first)
    expect(first.entities.length).toBe(1)

    // Another menu, other settings or another prefix still fetch.
    await requestMenu().get('footer')
    await requestMenu().get('main', { max_depth: 1 })
    await requestMenu().get('main', undefined, '/en')
    expect(menuCalls).toBe(4)
  })

  test('a client that withholds the cache neither reads nor fills it', async () => {
    await requestMenu(() => null).get('main')
    expect(store.size).toBe(0)
    await requestMenu().get('main')
    expect(menuCalls).toBe(2)
    await requestMenu(() => null).get('main')
    expect(menuCalls).toBe(3)
  })

  test('a client that withholds the cache once the request resolves does not fill it', async () => {
    // As when the request turns out to have carried credentials an interceptor added.
    let asked = 0
    await requestMenu(() => (asked++ === 0 ? handle : null)).get('main')
    expect(store.size).toBe(0)
  })

  test('a failed fetch leaves an earlier menu in place', async () => {
    await requestMenu().get('main')
    expect(store.size).toBe(1)

    // A reader that misses the entry, as a shorter-capped one can, and whose
    // fetch then fails, must not remove the entry others still read.
    const missing = { get: () => undefined, set: handle.set }
    const menu = requestMenu(() => missing)
    menu.druxt.getCollectionAll = async () => { throw new Error('backend down') }
    const result = await menu.get('main')
    expect(result.entities).toStrictEqual([])
    expect(store.size).toBe(1)
  })

  test('only a resolved menu is stored, never the request', async () => {
    await requestMenu().get('main')
    const [stored] = [...store.values()]
    expect(typeof stored.then).toBe('undefined')
    expect(stored.entities.length).toBe(1)
  })

  test('a client without processCache still works', async () => {
    await requestMenu(false).get('main')
    await requestMenu(false).get('main')
    expect(menuCalls).toBe(2)
  })

  test('a menu lives for the shortest lifetime of its pages, and is not stored when any page may not be', async () => {
    const stored = []
    const recording = { get: () => undefined, set: (key, value, seconds) => stored.push(seconds) }
    await requestMenu(() => recording, [300, 60]).get('main')
    await requestMenu(() => recording, [300, 0]).get('footer')
    expect(stored).toStrictEqual([60, 0])
  })

  test('a client that cannot report a lifetime stores nothing', async () => {
    const menu = requestMenu()
    delete menu.druxt.cacheLifetime
    await menu.get('main')
    expect(store.size).toBe(0)
  })
})
