// A stand-in for Nuxt 2's fetch, for integration tests that mount Druxt
// modules without Nuxt. It reproduces what those tests depend on: Nuxt calls
// fetch() before mount on the client, and $fetch() while a fetch runs returns
// the running one rather than starting another, as Nuxt 2's fetch.client.js
// does.
const Vue = require('vue').default || require('vue')

// The fetches still running, so a test can wait for them.
const inFlight = new Set()

const NuxtFetch = {
  beforeCreate() {
    if (!this.$options.fetch) return
    this.$fetchState = Vue.observable({ pending: false, error: null })
    this.$fetch = () => {
      if (!this._fetchPromise) {
        this.$fetchState.pending = true
        this._fetchPromise = Promise.resolve()
          .then(() => this.$options.fetch.call(this))
          .catch((err) => { this.$fetchState.error = err })
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
    if (this.$options.fetch) this.$fetch()
  },
}

/**
 * Waits until no fetch is running and Vue has rendered, for at most 20 rounds.
 *
 * @param {object} localVue - The test's Vue constructor.
 * @return {Promise<void>}
 */
const settle = async (localVue) => {
  for (let i = 0; i < 20; i++) {
    await Promise.all([...inFlight])
    await localVue.nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (!inFlight.size) break
  }
}

module.exports = { NuxtFetch, inFlight, settle }
