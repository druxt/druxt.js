import { DruxtMenu } from '..'

import mockAxios from 'jest-mock-axios'

jest.mock('axios')

const baseURL = 'https://example.com'
const menu = new DruxtMenu(baseURL, {})

describe('DruxtMenu', () => {
  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { new DruxtMenu() }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    expect(new DruxtMenu(baseURL)).toBeInstanceOf(DruxtMenu)
  })

  test('axiosSettings', () => {
    const headers = { 'X-DruxtRouter': true }
    new DruxtMenu(baseURL, {
      axios: { headers }
    })

    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL, headers })
  })

  test('get - getMenuLinkContent', async () => {
    const { entities } = await menu.get('main')

    expect(entities.length).toBe(4)
  })

  test('get - getJsonApiMenuItems', async () => {
    const jsonApiMenu = new DruxtMenu(baseURL, { menu: { jsonApiMenuItems: true } })
    const { entities } = await jsonApiMenu.get('main')

    expect(entities.length).toBe(3)
  })
})
