import { DruxtSchemaStore } from 'druxt-schema'
import { defineStore } from 'pinia'

const druxtSchemaStore = new DruxtSchemaStore()

export const useDruxtSchemaStore = defineStore('druxt/schema', {
  state: druxtSchemaStore.state,
  actions: {
    async get (context = {}) {
      return await druxtSchemaStore.get(context, {
        $druxtSchema: useNuxtApp().$druxtSchema,
        state: this
      })
    }
  }
})
