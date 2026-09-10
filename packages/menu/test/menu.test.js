let DruxtMenu, mockAxios

jest.mock('axios')

const baseUrl = 'https://demo-api.druxtjs.org'

describe('DruxtMenu class', () => {
  beforeEach(() => {
    // Reset module registry to clear the menu results cache.
    jest.resetModules()
    mockAxios = require('axios').default
    DruxtMenu = require('../src').DruxtMenu
  })

  test('constructor', () => {
    // Throw error if 'baseUrl' not provided.
    expect(() => { new DruxtMenu() }).toThrow('The \'baseUrl\' parameter is required.')

    // Ensure class type.
    expect(new DruxtMenu(baseUrl)).toBeInstanceOf(DruxtMenu)

    // Use an injected DruxtClient instance.
    const druxtClient = new (require('druxt').DruxtClient)(baseUrl)
    const menu = new DruxtMenu(baseUrl, { druxtClient })
    expect(menu.druxt).toStrictEqual(druxtClient)
  })

  test('buildQuery', () => {
    const menu = new DruxtMenu(baseUrl)
    const resource = 'menu_link_content--menu_link_content'

    expect(menu.buildQuery(resource, 'main', []).getQueryString())
      .toBe('filter%5Benabled%5D=1&filter%5Bmenu_name%5D=main')

    expect(menu.buildQuery(resource, 'main', ['id'], { requiredOnly: true }).getQueryString())
      .toBe('filter%5Benabled%5D=1&filter%5Bmenu_name%5D=main&fields%5Bmenu_link_content--menu_link_content%5D=id')

    expect(menu.buildQuery(resource, 'main', ['id'], { fields: ['title'] }).getQueryString())
      .toBe('filter%5Benabled%5D=1&filter%5Bmenu_name%5D=main&fields%5Bmenu_link_content--menu_link_content%5D=title%2Cid')
  })

  test('get - getMenuLinkContent', async () => {
    const menu = new DruxtMenu(baseUrl, {})

    // TODO - Add mock test data, Umami Profile has none.
    expect((await menu.get('main')).entities.length).toBe(0)
  })

  test('get - getMenuLinkContent sets url from link.resolvable_uri', async () => {
    const { entities } = await menu.get('footer')
    expect(entities.map(({ attributes }) => [attributes.title, attributes.url])).toStrictEqual([
      ['Tutorials', '/tutorials'],
      ['How-to guides', '/how-to'],
      ['Modules', '/modules'],
      ['API reference', '/api'],
      ['GitHub', 'https://github.com/druxt/druxt.js'],
      ['Discord', 'https://discord.druxtjs.org'],
      ['Druxt on Drupal.org', 'https://www.drupal.org/project/druxt'],
    ])
  })

  test('get - getMenuLinkContent keeps <nolink> empty', async () => {
    const { entities } = await menu.get('probe')
    expect(entities.map(({ attributes }) => [attributes.title, attributes.url])).toStrictEqual([
      ['Concepts', '/explanation'],
      ['Architecture', '/explanation/architecture'],
      ['Draft child', '/node/39'],
      ['API', '/api'],
      ['Component resolution', '/explanation/component-resolution'],
      ['GitHub', 'https://github.com/druxt/druxt.js'],
      ['Section heading', ''],
    ])
  })

  test('get - getJsonApiMenuItems keeps the url Drupal generated', async () => {
    const jsonApiMenu = new DruxtMenu(baseUrl, { menu: { jsonApiMenuItems: true } })
    const { entities } = await jsonApiMenu.get('probe')
    expect(entities.map(({ attributes }) => [attributes.title, attributes.url])).toStrictEqual([
      ['Concepts', '/explanation'],
      ['Architecture', '/explanation/architecture'],
      ['Component resolution', '/explanation/component-resolution'],
      ['API', '/api'],
      ['GitHub', 'https://github.com/druxt/druxt.js'],
      ['Section heading', ''],
    ])
  })

  test('get - getJsonApiMenuItems', async () => {
    const jsonApiMenu = new DruxtMenu(baseUrl, { menu: { jsonApiMenuItems: true } })

    // Ensure main menu returns three items.
    expect((await jsonApiMenu.get('main')).entities.length).toBe(3)

    // Ensure a non-existent menu returns no items.
    expect((await jsonApiMenu.get('error')).entities.length).toBe(0)

    // TODO - Add mock test data, Umami Profile doesn't have deep enough menu items.
    const settings = {
      max_depth: 3,
      min_depth: 2,
      parent: 'taxonomy_menu.menu_link:taxonomy_menu.menu_link.catalog.31',
    }
    await jsonApiMenu.get('catalog', settings)
    // expect((await jsonApiMenu.get('catalog', settings)).entities.length).toBe(3)
  })

  test('get - concurrent requests share one fetch', async () => {
    const menu = new DruxtMenu(baseUrl, { menu: { jsonApiMenuItems: true } })
    menu.getJsonApiMenuItems = jest.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ entities: [] })

    // A failed request is not cached, so the next call fetches again.
    await expect(menu.get('main')).rejects.toThrow('offline')
    await Promise.all([menu.get('main'), menu.get('main')])
    expect(menu.getJsonApiMenuItems).toHaveBeenCalledTimes(2)
  })

  test('get - cached per client and method', async () => {
    const druxtClient = new (require('druxt').DruxtClient)(baseUrl)
    const menuA = new DruxtMenu(baseUrl, { druxtClient, menu: { jsonApiMenuItems: true } })
    const menuB = new DruxtMenu(baseUrl, { druxtClient })
    const menuC = new DruxtMenu('https://other.example.com', { menu: { jsonApiMenuItems: true } })
    for (const menu of [menuA, menuB, menuC]) {
      menu.getJsonApiMenuItems = jest.fn(async () => ({ entities: [] }))
      menu.getMenuLinkContent = jest.fn(async () => ({ entities: [] }))
    }

    // The same client with a different method is a different entry.
    await menuA.get('main')
    await menuB.get('main')
    expect(menuA.getJsonApiMenuItems).toHaveBeenCalledTimes(1)
    expect(menuB.getMenuLinkContent).toHaveBeenCalledTimes(1)

    // Another client never sees the first client's results.
    await menuC.get('main')
    expect(menuC.getJsonApiMenuItems).toHaveBeenCalledTimes(1)
  })

  test('get - cached per process', async () => {
    const jsonApiMenu = new DruxtMenu(baseUrl, { menu: { jsonApiMenuItems: true } })

    await jsonApiMenu.get('main')
    const calls = mockAxios.get.mock.calls.length
    expect(calls).toBeGreaterThan(0)

    // A second get for the same menu makes no further requests.
    const result = await jsonApiMenu.get('main')
    expect(result.entities.length).toBe(3)
    expect(mockAxios.get.mock.calls.length).toBe(calls)
  })
})
