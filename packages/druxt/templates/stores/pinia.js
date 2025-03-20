import { DruxtStore } from 'druxt'
import { defineStore } from 'pinia'

const druxtStore = new DruxtStore()

export const useDruxtStore = defineStore('druxt', {
  state: druxtStore.state,

  actions: {
    addCollection (context = {}) {
      druxtStore.addCollection(context, { state: this })
    },

    addResource (context = {}) {
      druxtStore.addResource(context, { state: this })
    },

    async getCollection (context = {}) {
      return await druxtStore.getCollection(context, {
        $druxt: useNuxtApp().$druxt,
        state: this
      })
    },

    async getResource (context = {}) {
      return await druxtStore.getResource(context, {
        $druxt: useNuxtApp().$druxt,
        state: this
      })
    },

    async flushCollection (context = {}) {
      await druxtStore.flushCollection(context, {
        $druxt: useNuxtApp().$druxt,
        state: this
      })
    },

    async flushResource (context = {}) {
      await druxtStore.flushResource(context, {
        $druxt: useNuxtApp().$druxt,
        state: this
      })
    }
  },
})
