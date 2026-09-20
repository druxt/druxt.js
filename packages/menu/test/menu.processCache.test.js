import { DruxtMenu } from '../src/menu'

const baseUrl = 'https://demo-api.druxtjs.org'

// Stands in for the process cache DruxtClient.processCache('menu') returns.
const store = new Map()
const handle = { get: (key) => store.get(key), set: (key, value) => store.set(key, value) }

// Each server request gets its own client. `processCache` is null when the
// request carries credentials or the cache is off, and absent on an older druxt.
let menuCalls = 0
const requestMenu = (processCache = () => handle) => {
  const druxtClient = {
    indexKey: 'backend',
    options: { endpoint: '/jsonapi' },
    index: {},
    async getIndex(resource, prefix) { this.index[prefix] = this.index[prefix] || {} },
    async getCollectionAll() {
      menuCalls += 1
      return [{ data: [{ id: 'a', attributes: { url: '/', title: 'Home' } }] }]
    },
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

  test('a client without processCache still works', async () => {
    await requestMenu(false).get('main')
    await requestMenu(false).get('main')
    expect(menuCalls).toBe(2)
  })
})
