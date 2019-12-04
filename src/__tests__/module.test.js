jest.setTimeout(60000)

import { Nuxt, Builder } from 'nuxt-edge'
import getPort from 'get-port'

import config from '../__fixtures__/nuxt.config'

let nuxt, port

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
