import Vue from 'vue'

const DruxtMenuStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxtMenu'

  // In-flight requests for this store, kept out of the reactive state.
  const inFlight = new Map()

  /**
   * The druxtMenu Vuex module.
   *
   * Provides a Vuex state object, mutations, actions and getters for
   * interacting Drupal JSON:API Menu Items.
   *
   * @name druxtMenu
   * @module druxtMenu
   *
   * @see {@link https://druxtjs.org/explanation/druxt-store|The DruxtStore}
   */
  const module = {
    namespaced: true,

    /**
     * Vuex State object.
     */
    state: () => ({
      entities: {},
      loaded: {}
    }),

    /**
     * Vuex Mutations.
     */
    mutations: {
      /**
       * @name addEntities
       * @mutator {object} addEntities=entities Adds specified Drupal JSON:API Menu Items data to the Vuex state object.
       * @param {State} state - The Vuex State object.
       * @param {addEntitiesPayload} payload - The mutation payload.
       *
       * @example @lang js
       * this.$store.commit('druxtMenu/addEntities', { entities, prefix })
       */
      addEntities (state, { entities, prefix }) {
        if (!state.entities[prefix]) Vue.set(state.entities, prefix, {})

        for (const index in entities) {
          const entity = entities[index]
          // Menus asking for different fields share items, so each keeps the fields the others fetched.
          const stored = state.entities[prefix][entity.id]
          Vue.set(state.entities[prefix], entity.id, stored
            ? {
                ...stored,
                ...entity,
                attributes: { ...stored.attributes, ...entity.attributes },
                relationships: { ...stored.relationships, ...entity.relationships },
              }
            : entity)
        }
      },

      /**
       * @name addLoaded
       * @mutator {object} addLoaded=loaded Records the items of a menu loaded into the Vuex state object.
       * @param {State} state - The Vuex State object.
       * @param {object} payload - The mutation payload.
       * @param {string} payload.key - The menu name and settings key.
       * @param {string[]} payload.ids - The IDs of the menu's items.
       * @param {string} [payload.prefix] - (Optional) The JSON:API endpoint prefix or langcode.
       *
       * @private
       */
      addLoaded (state, { key, ids, prefix }) {
        if (!state.loaded) Vue.set(state, 'loaded', {})
        if (!state.loaded[prefix]) Vue.set(state.loaded, prefix, {})
        Vue.set(state.loaded[prefix], key, ids)
      },

      /**
       * @name flushEntities
       * @mutator {object} flushEntities=entities Removes JSON:API menu item entities from the Vuex state object.
       * @param {object} state - The Vuex state object.
       * @param {flushEntitiesPayload} payload - The mutation payload.
       *
       * @example @lang js
       * // Flush all menu entities.
       * this.$store.commit('druxtMenu/flushEntities', {})
       */
      flushEntities (state, { prefix }) {
        // A menu being fetched for a flushed prefix is fetched again before it is stored.
        for (const request of inFlight.values()) {
          if (!prefix || request.prefix === String(prefix)) request.stale = true
        }

        if (!prefix || typeof state.entities !== 'object') Vue.set(state, 'entities', {})
        if (prefix) Vue.set(state.entities, prefix, {})

        // Flushed menus must be fetched again.
        if (!prefix || typeof state.loaded !== 'object') Vue.set(state, 'loaded', {})
        if (prefix) Vue.set(state.loaded, prefix, {})
      },
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get menu by name.
       *
       * - Returns the stored items without a request when the same menu, settings and prefix are already in the store.
       * - Fetches the menu items from the JSON:API endpoint, sharing one request between identical concurrent calls.
       * - Fetches again when the store is flushed for the menu's prefix during the request, so a flushed menu is never stored or returned.
       * - Commits the menu items to the Vuex state object and returns them.
       *
       * @name get
       * @action get=entities
       * @param {object} vuexContext - The Vuex action context.
       * @param {Function} vuexContext.commit - Commits mutations to the store.
       * @param {object} vuexContext.state - The Vuex module state.
       * @param {string|object} context - The menu name, or an object containing the menu `name` and optional `settings` and `prefix` properties.
       * @returns {object[]|undefined} The stored menu items, or undefined when the store was flushed during every attempt.
       *
       * @example @lang js
       * const entities = await this.$store.dispatch('druxtMenu/get', { name: 'main' })
       */
      async get ({ commit, state }, context) {
        const { name, settings, prefix } = typeof context === 'object'
          ? context
          : { name: context }

        // The menu is already in the store.
        const key = JSON.stringify([name, settings || {}])
        const loaded = ((state.loaded || {})[prefix] || {})[key]
        if (loaded) return loaded.map((id) => ((state.entities || {})[prefix] || {})[id])

        // Identical concurrent calls share one request, which a flush of its prefix restarts.
        const requestKey = JSON.stringify([String(prefix), key])
        if (!inFlight.has(requestKey)) {
          // Registered before it starts, so a flush during the first call still reaches it.
          const request = { prefix: String(prefix), stale: false }
          inFlight.set(requestKey, request)
          request.promise = (async () => {
            // A menu fetched across a flush may be stale, so it is fetched again.
            for (let attempt = 0; attempt < 3; attempt += 1) {
              request.stale = false
              const { entities } = (await this.$druxtMenu.get(name, settings, prefix)) || {}
              if (!request.stale) {
                commit('addEntities', { entities, prefix })
                commit('addLoaded', { key, prefix, ids: (entities || []).map((entity) => entity.id) })
                return entities
              }
            }
          })()
          // A failed request is dropped, so the next call tries again.
          const clear = () => { if (inFlight.get(requestKey) === request) inFlight.delete(requestKey) }
          request.promise.then(clear, clear)
        }

        return inFlight.get(requestKey).promise
      }
    },

    /**
     * Vuex Getters.
     */
    getters: {
      /**
       * Get entities by filter.
       *
       * @name getEntitiesByFilter
       * @type {Function}
       * @param {object} state - The Vuex state object.
       * @returns {Function} Filter function; takes `{ filter, prefix }` where `filter` is a `filter()` method compatible function.
       *
       * @example @lang js
       * const items = this.$store.getters.getEntitiesByFilter(key => {
       *   return this.entities[key].attributes.menu_name === 'main'
       * })
       */
      getEntitiesByFilter: (state) => ({ filter, prefix }) => {
        // A flush without a prefix replaces the whole object, so the prefix
        // stops existing until the next fetch stores it again.
        const keys = Object.keys((state.entities || {})[prefix] || {}).filter(key => filter(key))
        if (!keys.length) return {}

        return Object.assign(
          ...keys.map(key => ({ [key]: state.entities[prefix][key] }))
        )
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtMenuStore }

/**
 * The Vuex State object.
 *
 * @typedef {object} State
 * @property {object} entities - The Drupal JSON:API Menu Item entities.
 * @property {object} loaded - The IDs of each loaded menu's items, keyed by prefix, then by menu name and settings.
 */

/**
 * Parameters for the `addEntities` mutation.
 *
 * @typedef {object} addEntitiesPayload
 *
 * @param {object[]} entities - The Drupal JSON:API Menu Item entities.
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 *
 * @example @lang js
 * {
 *   entities: [{}],
 *   prefix: 'en'
 * }
 */

/**
 * Parameters for the `flushEntities` mutation.
 *
 * @typedef {object} flushEntitiesPayload
 *
 * @param {string} [prefix] - (Optional) The JSON:API endpoint prefix or langcode.
 *
 * @example @lang js
 * {
 *   prefix: 'en'
 * }
 */
