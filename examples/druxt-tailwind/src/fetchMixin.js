import Vue from 'vue'

/**
 * Replicates the one piece of Nuxt magic Druxt's components actually rely
 * on: Nuxt's fetch mixin (`@nuxt/vue-app`) automatically invokes a
 * component's `async fetch()` method and exposes `$fetchState.pending`
 * while it's in flight. Plain Vue has no equivalent lifecycle hook - every
 * `DruxtModule`-based component (DruxtEntity, DruxtMenu, DruxtBreadcrumb,
 * DruxtView, DruxtRouter, ...) defines `fetch()` but never calls it itself.
 *
 * This is the only Nuxt-specific behavior in this example that has no
 * framework-agnostic equivalent already built into druxt.js - everything
 * else (Vuex store modules, DruxtClient, the components themselves) works
 * outside Nuxt unmodified.
 *
 * Applied globally via `Vue.mixin()` in main.js, so it's active for every
 * component in the app, matching how Nuxt applies its own fetch mixin.
 *
 * `$fetchState` is assigned directly in `beforeCreate()` via
 * `Vue.observable()` rather than returned from `data()` - a component that
 * also defines its own `data()` (as DruxtModule-based components do) would
 * otherwise depend on Vue's parent/child `data()` merge order to preserve
 * this key, which is fragile. Assigning it directly sidesteps that merge
 * entirely.
 */
export const fetchMixin = {
  beforeCreate() {
    if (typeof this.$options.fetch !== 'function') return
    this.$fetchState = Vue.observable({
      pending: true,
      error: null,
      timestamp: 0,
    })
  },

  async created() {
    if (typeof this.$options.fetch !== 'function') return

    try {
      // `this.fetch()` (not `this.$options.fetch.call(this)`) would be the
      // natural-looking call here, but `fetch` is a Nuxt-specific top-level
      // component option, not a Vue `methods` entry - Vue never binds it
      // onto the instance itself, only onto `$options`. Calling `this.fetch()`
      // directly fails silently in a very specific way: `this.fetch` is
      // `undefined`, calling it throws, the `catch` below swallows that into
      // `$fetchState.error`, and every component looks like it "loaded" with
      // no data and no visible error - Nuxt's own fetch mixin does this
      // `.call(this)` binding internally, invisibly, which is exactly the
      // kind of implicit behavior this example is meant to surface.
      await this.$options.fetch.call(this)
    } catch (err) {
      this.$fetchState.error = err
    } finally {
      this.$fetchState.pending = false
      this.$fetchState.timestamp = Date.now()
    }
  },
}
