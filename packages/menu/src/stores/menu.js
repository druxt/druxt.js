import Vue from 'vue'

const DruxtMenuStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  /**
   * @namespace
   */
  const namespace = 'druxtMenu'

  // Moved on by a flush, so a menu fetched before it is not stored.
  const generation = { value: 0 }

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
      entities: {}
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
          Vue.set(state.entities[prefix], entity.id, entity)
        }
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
        generation.value += 1
        if (!prefix || typeof state.entities !== 'object') Vue.set(state, 'entities', {})
        if (prefix) Vue.set(state.entities, prefix, {})
      },
    },

    /**
     * Vuex Actions.
     */
    actions: {
      /**
       * Get menu by name.
       *
       * - Fetches the menu items from the JSON:API endpoint.
       * - Commits the menu items to the Vuex state object.
       * - Fetches again when the store is flushed during the request, so a flushed menu is never stored or returned.
       * - Returns the stored menu items.
       *
       * @name get
       * @action get=entities
       * @param {object} vuexContext - The Vuex action context.
       * @param {Function} vuexContext.commit - Commits mutations to the store.
       * @param {string|object} context - The menu name, or an object containing the menu `name` and optional `settings` and `prefix` properties.
       * @returns {object[]|undefined} The stored menu items, or undefined when the store was flushed during every attempt.
       *
       * @example @lang js
       * const entities = await this.$store.dispatch('druxtMenu/get', { name: 'main' })
       */
      async get ({ commit }, context) {
        const { name, settings, prefix } = typeof context === 'object'
          ? context
          : { name: context }
        // A menu fetched across a flush may be stale, so it is fetched again.
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const since = generation.value
          const { entities } = (await this.$druxtMenu.get(name, settings, prefix)) || {}
          if (since === generation.value) {
            commit('addEntities', { entities, prefix })
            return entities
          }
        }
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
