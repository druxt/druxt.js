import md5 from 'md5'
import Vue from 'vue'

const DruxtViewsStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxt/views'

  /**
   * The druxt/views Vuex module.
   *
   * Provides a Vuex state object, mutations and actions for interacting with JSON:API Views.
   *
   * @name druxt/views
   * @module druxt/views
   */
  const module = {
    namespaced: true,

    /**
     * Vuex State object.
     *
     * @name state
     * @type {object}
     * @property {object} results - JSON:API Views results store.
     * @readonly
     */
    state: () => ({
      results: {}
    }),

    /**
     * Vuex Mutations.
     */
    mutations: {
      /**
       * @name addResults
       * @mutator {object} addResults=results Adds JSON:API Views results to the Vuex state object.
       * @param {object} results - The JSON:API Views results.
       *
       * @example @lang js
       * this.$store.commit('druxt/views/addResults', { results, viewId, displayId, prefix, hash })
       */
      addResults (state, { results, viewId, displayId, prefix, hash }) {
        if (!results || !viewId || !displayId || !hash) return

        if (!state.results[viewId]) Vue.set(state.results, viewId, {})
        if (!state.results[viewId][displayId]) Vue.set(state.results[viewId], displayId, {})
        if (!state.results[viewId][displayId][prefix]) Vue.set(state.results[viewId][displayId], prefix, {})
        Vue.set(state.results[viewId][displayId][prefix], hash, results)
      },

      /**
       * @name flushResults
       * @mutator {object} addResults=results Removes JSON:API Views results from the Vuex state object.
       *
       * @example @lang js
       * this.$store.commit('druxt/views/flushResults', { viewId, displayId, prefix, hash })
       */
      flushResults (state, { viewId, displayId, prefix, hash }) {
        if (!viewId) Vue.set(state, 'results', {})
        else if (viewId && !displayId) Vue.set(state.results, viewId, {})
        else if (viewId && displayId && !prefix) Vue.set(state.results[viewId], displayId, {})
        else if (viewId && displayId && prefix && !hash) Vue.set(state.results[viewId][displayId], prefix, {})
        else if (viewId && displayId && prefix && hash) Vue.set(state.results[viewId][displayId][prefix], hash, {})
      },
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get View results.
       *
       * - Executes query against Drupal JSON:API.
       * - Caches result in the Vuex store.
       * - Returns cached result from Vuex store when available.
       *
       * @name getResults
       * @action get=results
       * @param {object} query The View results query object
       * @return {object} The JSON:API Views results resource.
       *
       * @example @lang js
       * const { data, meta, links } = await this.$store.dispatch('druxt/view/getResults', {
       *   viewId,
       *   displayId,
       *   query
       * })
       */
      async getResults ({ commit, state }, { viewId, displayId, query, prefix, bypassCache = false }) {
        const hash = query ? md5(this.$druxt.buildQueryUrl('', query)) : '_default'
        if (!bypassCache && typeof (((state.results[viewId] || {})[displayId] || {})[prefix] || {})[hash] !== 'undefined') {
          return state.results[viewId][displayId][prefix][hash]
        }

        const results = await this.$druxt.getResource(`views--${viewId}`, displayId, query, prefix)

        commit('addResults', { results, viewId, displayId, prefix, hash })

        return results
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtViewsStore }
