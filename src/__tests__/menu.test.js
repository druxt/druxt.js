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

  test('get', async () => {
    const result = await menu.get('main')
    // expect(result).toBe(1)
  })
})
