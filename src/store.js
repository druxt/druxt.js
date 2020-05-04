const DruxtSchemaStore = ({ store }) => {
  if (typeof store === 'undefined') {
    throw new TypeError('Vuex store not found.')
  }

  const namespace = 'druxtSchema'
  const module = {
    namespaced: true,

    state: () => ({
      schemas: {}
    }),

    mutations: {
      addSchema(state, { id, schema }) {
        state.schemas[id] = schema
      }
    },

    actions: {
      async get({ state, commit }, resource = {}) {
        resource = {
          id: null,
          resourceType: null,
          entityType: 'node',
          bundle: null,
          mode: 'default',
          schemaType: 'view',

          ...resource
        }

        // Build ID from resource type.
        if (!resource.id && resource.resourceType) {
          resource.id = [resource.resourceType, resource.mode, resource.schemaType].join('--')
        }

        // Build ID from entity and bundle types.
        if (!resource.id && resource.bundle) {
          resource.id = [resource.entityType, resource.bundle, resource.mode, resource.schemaType].join('--')
        }

        if (!resource.id) {
          return false
        }

        // Only load if we don't have this schema in the store.
        if (!state.schemas[resource.id]) {
          const schema = await this.$druxtSchema.import(resource.id)
          commit('addSchema', { id: resource.id, schema })
        }

        return state.schemas[resource.id]
      }
    }
  }

  store.registerModule(namespace, module, {
    preserveState: Boolean(store.state[namespace])
  })
}

export { DruxtSchemaStore }
