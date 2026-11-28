import { DruxtMenu } from '../src/menu'

const baseUrl = 'https://api.umami.demo.druxtjs.org'

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
    async getIndex(resource, prefix) {
      this.index[prefix] = this.index[prefix] || {}
      return resource ? { href: `${prefix || ''}/jsonapi/menu_link_content/menu_link_content` } : this.index[prefix]
    },
    async getCollectionAll() {
      menuCalls += 1
      return lifetimes.map((lifetime) => ({ lifetime, data: [{ id: 'a', attributes: { url: '/', title: 'Home' } }] }))
    },
    cacheLifetime: (collection) => (collection || {}).lifetime || 0,
    buildQueryUrl: (href, query) => `${href}?${typeof query === 'string' ? query : query.getQueryString()}`,
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
    expect(menu.druxt.processCache).toHaveBeenCalledWith('menu', expect.stringMatching(/^\/jsonapi\/menu_items\/main\?/))
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

  test('a menu asked without a langcode is kept by the language it resolves to', async () => {
    // Two backends' clients alike but for the default language, as `urlPrefix()` resolves it.
    const prefixes = { en: '', es: 'es' }
    const withDefault = (defaultLangcode) => {
      const menu = requestMenu()
      menu.druxt.urlPrefix = (prefix) => prefixes[prefix || defaultLangcode]
      return menu
    }
    await withDefault('en').get('main')
    await withDefault('es').get('main')
    expect(menuCalls).toBe(2)

    // The same language asked for by its langcode shares the entry.
    await withDefault('en').get('main', undefined, 'es')
    expect(menuCalls).toBe(2)
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

  test('a menu fetched before a clear is not stored after it', async () => {
    // A generation-aware handle, as the real process cache is: it refuses a
    // write whose reported generation predates the last clear.
    let generation = 0
    const genHandle = () => ({
      generation,
      get: (key) => store.get(key),
      set: (key, value, seconds, since) => {
        if (since !== undefined && since !== generation) return
        if (seconds > 0) store.set(key, value)
      },
    })

    const menu = requestMenu(() => genHandle())
    // The cache is cleared while the menu request is in flight.
    const inFlight = menu.druxt.getCollectionAll.bind(menu.druxt)
    menu.druxt.getCollectionAll = async (...args) => {
      const collections = await inFlight(...args)
      generation += 1
      return collections
    }

    await menu.get('main')
    expect(store.size).toBe(0)
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

  test('the cache is asked with the URL the menu is fetched from', async () => {
    // A site whose interceptor signs only menu requests: the cache is withheld for those.
    const signsMenus = (scope, url) => (url || '').includes('/menu') ? null : handle
    await requestMenu().get('main')
    await requestMenu(signsMenus).get('main')
    expect(menuCalls).toBe(2)
    // One that signs only requests with a query is seen too.
    const signsQueries = (scope, url) => (url || '').includes('?') ? null : handle
    await requestMenu(signsQueries).get('main')
    expect(menuCalls).toBe(3)

    const linkContent = requestMenu()
    linkContent.options.menu.jsonApiMenuItems = false
    await linkContent.get('main', undefined, '/es')
    expect(linkContent.druxt.processCache).toHaveBeenCalledWith('menu', expect.stringMatching(/^\/es\/jsonapi\/menu_link_content\/menu_link_content\?filter/))
  })
})
