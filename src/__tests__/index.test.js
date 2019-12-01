import druxtRouter from '..'

// const baseURL = 'https://example.com'
const baseURL = 'http://contenta.druxt.localhost'

describe('Druxt router', () => {
  test('constructor', () => {
    // Throw error if 'baseURL' not provided.
    expect(() => { new druxtRouter }).toThrow('The \'baseURL\' parameter is required.')

    // Ensure class type.
    expect(new druxtRouter(baseURL)).toBeInstanceOf(druxtRouter)
  })

  test('get', async () => {
    const router = new druxtRouter(baseURL)
    const result = await router.get('/')

    expect(result.entity).toBeDefined()
    expect(result.isHomePath).toBeTruthy()
    expect(result.jsonapi).toBeDefined()
    expect(result.label).toBeDefined()
    expect(result.resolved).toBeDefined()
    expect(result).toMatchSnapshot()
  })
})
