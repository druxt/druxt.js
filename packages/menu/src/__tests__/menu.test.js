import { DruxtMenu } from '..'

import mockAxios from 'jest-mock-axios'

jest.mock('axios')

const baseUrl = 'https://demo-api.druxtjs.org'
const menu = new DruxtMenu(baseUrl, {})

describe('DruxtMenu class', () => {
  test('constructor', () => {
    // Throw error if 'baseUrl' not provided.
    expect(() => { new DruxtMenu() }).toThrow('The \'baseUrl\' parameter is required.')

    // Ensure class type.
    expect(new DruxtMenu(baseUrl)).toBeInstanceOf(DruxtMenu)
  })

  test('buildQuery', () => {
    const resource = 'menu_link_content--menu_link_content'

    expect(menu.buildQuery(resource, 'main', []).getQueryString())
      .toBe('filter%5Benabled%5D=1&filter%5Bmenu_name%5D=main')

    expect(menu.buildQuery(resource, 'main', ['id'], { requiredOnly: true }).getQueryString())
      .toBe('filter%5Benabled%5D=1&filter%5Bmenu_name%5D=main&fields%5Bmenu_link_content--menu_link_content%5D=id')

    expect(menu.buildQuery(resource, 'main', ['id'], { fields: ['title'] }).getQueryString())
      .toBe('filter%5Benabled%5D=1&filter%5Bmenu_name%5D=main&fields%5Bmenu_link_content--menu_link_content%5D=title%2Cid')
  })

  test('get - getMenuLinkContent', async () => {
    const { entities } = await menu.get('main')

    expect(entities.length).toBe(4)
  })

  test('get - getJsonApiMenuItems', async () => {
    const jsonApiMenu = new DruxtMenu(baseUrl, { menu: { jsonApiMenuItems: true } })

    expect((await jsonApiMenu.get('main')).entities.length).toBe(3)

    const settings = {
      max_depth: 3,
      min_depth: 2,
      parent: 'taxonomy_menu.menu_link:taxonomy_menu.menu_link.catalog.31',
    }
    expect((await jsonApiMenu.get('catalog', settings)).entities.length).toBe(3)
  })
})
