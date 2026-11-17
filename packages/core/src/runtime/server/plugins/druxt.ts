import { defineNitroPlugin } from 'nitropack/runtime'
import { storedDrupalSettings } from '../storage'

// Gives each request a reader for the settings stored from Drupal.
//
// The core plugin seeds the public tier into state from it, and `useDruxtServerSettings()` reads both tiers. Nothing
// is read until one of them asks.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.druxtStoredSettings = storedDrupalSettings(event)
  })
})
