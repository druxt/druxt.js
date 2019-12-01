jest.setTimeout(60000)

// import axios from 'axios'
import { Nuxt, Builder } from 'nuxt-edge'
import config from '../__fixtures__/nuxt.config'
// import Vue from 'vue'

// import module from '../module'

describe('Nuxt', () => {
  test('Module', async () => {
    const nuxt = new Nuxt(config)
    await nuxt.ready()

    const builder = new Builder(nuxt)
    await builder.build()

    expect(1).toBe(2)
  })
})