import { markRaw } from 'vue'
import type { DruxtClient } from '@druxt/client'
import { defineNuxtPlugin } from '#app'

// Gives every store the Druxt services, `this.$druxt` and the modules' own,
// as 1.x's Vuex stores had them. Read when a store is created, after all plugins ran;
// Nuxt provides are non-enumerable getters, hence getOwnPropertyNames.
export default defineNuxtPlugin({
  name: 'druxt-pinia',
  dependsOn: ['pinia', 'druxt'],
  setup(nuxtApp) {
    const services = nuxtApp as unknown as Record<string, object>
    nuxtApp.$pinia.use(() => Object.fromEntries(Object.getOwnPropertyNames(nuxtApp)
      .filter((key) => key.startsWith('$druxt'))
      .map((key) => [key, markRaw(services[key]!)])))
  },
})

declare module 'pinia' {
  export interface PiniaCustomProperties {
    $druxt: DruxtClient
  }
}
