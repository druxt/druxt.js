import { Druxt } from '..'

const baseURL = 'https://example.com'

describe('Druxt', () => {
  test('constructor', async () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { return new Druxt() }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    const druxt = new Druxt(baseURL)
    expect(druxt).toBeInstanceOf(Druxt)
  })
})
