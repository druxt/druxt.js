// A stand-in for Nuxt 2's fetch, for integration tests that mount Druxt
// modules without Nuxt. It reproduces what those tests depend on: Nuxt calls
// fetch() before mount on the client, $fetch() while a fetch runs returns the
// running one rather than starting another, and a server-rendered component
// mounts with its data and doesn't fetch, as Nuxt 2's fetch.client.js does.
const Vue = require('vue').default || require('vue')

// The fetches still running, so a test can wait for them.
const inFlight = new Set()

// How long a fetch stays running at the least, as Nuxt's `fetchDelay` keeps
// it, 200 ms by default. Tests run without it unless they set one.
let fetchDelay = 0

/**
 * Sets how long each fetch stays running at the least, as Nuxt's `fetchDelay`.
 *
 * @param {number} ms - The delay in milliseconds, 0 for none.
 */
const setFetchDelay = (ms) => { fetchDelay = ms }

// Gives a component the data it is hydrated with. Nuxt restores a
// server-rendered component's data from the page payload, and doesn't fetch
// on the client.
let hydration = null

/**
 * Sets the data each component mounts with in place of fetching, as on a
 * server-rendered page. The component keeps its `$fetch()`.
 *
 * @param {?Function} restore - Takes the component and returns its data, or nothing for a component that fetches. `null` turns hydration off.
 */
const setHydration = (restore) => { hydration = restore }

const NuxtFetch = {
  beforeCreate() {
    if (!this.$options.fetch) return
    this.$fetchState = Vue.observable({ pending: false, error: null })
    this.$fetch = () => {
      if (!this._fetchPromise) {
        this.$fetchState.pending = true
        this.$fetchState.error = null
        const start = Date.now()
        this._fetchPromise = Promise.resolve()
          .then(() => this.$options.fetch.call(this))
          .catch((err) => { this.$fetchState.error = err })
          .then(() => {
            const left = fetchDelay - (Date.now() - start)
            if (left > 0) return new Promise((resolve) => setTimeout(resolve, left))
          })
          .then(() => {
            this.$fetchState.pending = false
            inFlight.delete(this._fetchPromise)
            delete this._fetchPromise
          })
        inFlight.add(this._fetchPromise)
      }
      return this._fetchPromise
    }
  },

  beforeMount() {
    if (!this.$options.fetch) return
    const data = hydration && hydration(this)
    if (!data) return this.$fetch()
    for (const key of Object.keys(data)) this[key] = data[key]
  },
}

/**
 * Waits until no fetch is running and Vue has rendered. Throws when fetches
 * still run after 20 rounds, as a fetch that keeps starting another would.
 *
 * @param {object} localVue - The test's Vue constructor.
 * @return {Promise<void>}
 */
const settle = async (localVue) => {
  for (let i = 0; i < 20; i++) {
    await Promise.all([...inFlight])
    await localVue.nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (!inFlight.size) return
  }
  throw new Error(`${inFlight.size} fetches still running after 20 rounds`)
}

module.exports = { NuxtFetch, inFlight, setFetchDelay, setHydration, settle }
