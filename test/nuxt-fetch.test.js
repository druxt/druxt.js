// The stand-in for Nuxt's fetch that the integration tests mount with.
import { createLocalVue, mount } from '@vue/test-utils'

const { NuxtFetch, holdFetchDelay, inFlight, setFetchDelay, settle } = require('./nuxt-fetch')

const mountFetching = () => {
  const localVue = createLocalVue()
  localVue.mixin(NuxtFetch)
  const fetch = jest.fn()
  const wrapper = mount({ fetch, render: (h) => h('div') }, { localVue })
  return { fetch, localVue, vm: wrapper.vm }
}

describe('NuxtFetch', () => {
  afterEach(() => setFetchDelay(0))

  test('a fetch whose delay rejects is over, and the next one starts', async () => {
    setFetchDelay(Promise.reject(new Error('delay')))
    const { fetch, localVue, vm } = mountFetching()
    // The rejection reaches whoever waits on the fetch.
    await expect(settle(localVue)).rejects.toThrow('delay')
    expect(vm.$fetchState.pending).toBe(false)
    expect(vm._fetchPromise).toBeUndefined()
    expect(inFlight.size).toBe(0)

    setFetchDelay(0)
    await vm.$fetch()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('a held delay says when a fetch reaches it, and lets it go', async () => {
    const delay = holdFetchDelay()
    const { fetch, localVue, vm } = mountFetching()
    await delay.entered
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vm.$fetchState.pending).toBe(true)

    delay.release()
    delay.release()
    await settle(localVue)
    expect(vm.$fetchState.pending).toBe(false)
  })
})
