import { DruxtMenu } from '..'

import mockAxios from 'jest-mock-axios'

jest.mock('axios')

const baseUrl = 'https://demo-api.druxtjs.org'
const menu = new DruxtMenu(baseUrl, {})

describe('DruxtMenu', () => {
  test('constructor', () => {
    // Throw error if 'baseUrl' not provided.
    expect(() => { new DruxtMenu() }).toThrow('The \'baseUrl\' parameter is required.')

    // Ensure class type.
    expect(new DruxtMenu(baseUrl)).toBeInstanceOf(DruxtMenu)
  })

  test('axiosSettings', () => {
    const headers = { 'X-DruxtRouter': true }
    new DruxtMenu(baseUrl, {
      axios: { headers }
    })

    expect(mockAxios.create).toHaveBeenCalledWith({ baseURL: baseUrl, headers })
  })

  test('get - getMenuLinkContent', async () => {
    const { entities } = await menu.get('main')

    expect(entities.length).toBe(4)
  })

  test('get - getJsonApiMenuItems', async () => {
    const jsonApiMenu = new DruxtMenu(baseUrl, { menu: { jsonApiMenuItems: true } })
    const { entities } = await jsonApiMenu.get('main')

    expect(entities.length).toBe(3)
  })
})
