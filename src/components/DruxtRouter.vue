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
import { mapState } from 'vuex'

/**
 * The DruxtRouter Vue.js component.
 *
 * @example @lang vue
 * <DruxtRouter />
 */
export default {
  name: 'DruxtRouter',

  mixins: [DruxtComponentMixin],

  async middleware ({ store, redirect, route }) {
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
