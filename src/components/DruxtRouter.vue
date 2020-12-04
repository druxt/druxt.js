<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    :class="wrapper.class"
    :style="wrapper.style"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      v-bind="component.propsData"
    >
      {{ route }}
    </component>
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'
import { mapActions } from 'vuex'

/**
 * The DruxtRouter Vue.js component.
 *
 * @example @lang vue
 * <DruxtRouter />
 */
export default {
  name: 'DruxtRouter',

  mixins: [DruxtComponentMixin],

  /**
   * Nuxt fetch method.
   *
   * - Loads the route and redirect information from the Vuex store.
   * - Resolves redirects.
   *
   * @see {@link https://nuxtjs.org/api/pages-fetch/}
   */
  async fetch () {
    const { route, redirect } = await this.get(this.$route.fullPath)
    this.route = route
    this.redirect = redirect

    // Process redirect.
    if (redirect) {
      this.$redirect(redirect)
    }

    // Fetch theme component.
    await DruxtComponentMixin.fetch.call(this)
  },

  data: () => ({
    route: {},
    redirect: {}
  }),

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} redirect The current Redirect, if applicable.
   * @vue-computed {object} route The current Route.
   */
  computed: {
    module () {
      return (this.route || {}).component && this.route.component.startsWith('druxt-') ? this.route.component.substring(6) : false
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
    }
  },

  methods: {
    ...mapActions({
      get: 'druxtRouter/get'
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
  },

  druxt: ({ vm }) => ({
    componentOptions: [
      // @TODO - Add Path options.
      [vm.module ? vm.module : 'error', vm.route.isHomePath ? 'front' : 'not-front'],
      ['default']
    ],
    propsData: {
      route: vm.route
    }
  })
}
</script>
