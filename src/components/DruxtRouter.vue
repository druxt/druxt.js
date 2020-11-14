<template>
  <div>
    <component :is="component" v-if="route" v-bind="props" />
  </div>
</template>

<script>
import { mapState } from 'vuex'

/**
 * The DruxtRouter Vue.js component.
 *
 * @example @lang vue
 * <DruxtRouter />
 */
export default {
  name: 'DruxtRouter',

  /**
   * Nuxt fetch method.
   *
   * - Loads the route and redirect information from the Vuex store.
   * - Resolves redirects.
   *
   * @see {@link https://nuxtjs.org/api/pages-fetch/}
   */
  async fetch ({ store, redirect, route }) {
    const result = await store.dispatch('druxtRouter/get', route.fullPath)

    // Process redirect.
    if (result.redirect) {
      redirect(result.redirect)
    }
  },

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} redirect The current Redirect, if applicable.
   * @vue-computed {object} route The current Route.
   */
  computed: {
    /**
     * Route component.
     * @type {boolean|string}
     * @default false
     */
    component () {
      return this.route.component || false
    },

    /**
     * Route title.
     * @type {boolean|string}
     * @default false
     */
    title () {
      return this.route.label || false
    },

    /**
     * Route component property data.
     * @type {object|string}
     * @default false
     */
    props () {
      return this.route.props || false
    },

    ...mapState({
      redirect: state => state.druxtRouter.redirect,
      route: state => state.druxtRouter.route
    })
  },

  /**
   * Nuxt head method.
   *
   * - Sets the page title.
   * - Sets the canonical link.
   *
   * @see {@link https://nuxtjs.org/api/pages-head/}
   * @todo Improve metatag support.
   */
  head () {
    return {
      title: this.title,
      link: [
        {
          rel: 'canonical',
          href: this.canonical || this.route.canonical
        }
      ],
      meta: this.metatags || false
    }
  }
}
</script>
