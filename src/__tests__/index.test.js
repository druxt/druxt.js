jest.setTimeout(60000)

import func from '..'

import { Nuxt, Builder } from 'nuxt-edge'
import getPort from 'get-port'

import config from '../__fixtures__/nuxt.config'

let nuxt, port

describe('Module', () => {
  test('Init', () => {
    const mock = { func }
    expect(() => { mock.func() }).toThrow('Druxt settings missing.')
  })
})

describe('Nuxt', () => {
  beforeAll(async () => {
    nuxt = new Nuxt(config)
    await nuxt.ready()
    await new Builder(nuxt).build()

    port = await getPort()
    await nuxt.listen(port)
  })

  afterAll(async () => {
    await nuxt.close()
  })

  test('Module', async () => {
    const result = await nuxt.server.renderRoute('/')

    expect(result.error).toEqual({
      message: 'Not Found',
      statusCode: 404
    })
  })
})
