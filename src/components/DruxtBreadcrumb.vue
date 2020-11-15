<template>
  <div v-if="crumbs.length > 0">
    <component
      :is="settings.component"
      :items="crumbs"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

/**
 * The `<druxt-breadcrumb />` Vue.js component.
 *
 * @example @lang vue
 * <druxt-breadcrumb />
 */
export default {
  name: 'DruxtBreadcrumb',

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The breadcrumb render component.
     *
     * @type {string}
     * @default div
     * @example @lang vue
     * <DruxtBeadcrumb component="b-breadcrumb" />
     */
    component: {
      type: String,
      default: 'div'
    },

    /**
     * Show home crumb?
     *
     * @type {boolean}
     * @default false
     * @example @lang vue
     * <DruxtBreacrumb :home="false" />
     */
    home: {
      type: Boolean,
      default: true
    }
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    await this.fetch()
  },

  /**
   * Vue.js Data object.
   *
   * @property {objects[]} crumbs - The Breadcrumbs.
   */

  data: () => ({
    crumbs: [],
  }),

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} route The current Route.
   * @vue-computed {object} routes All available routes.
   */
  computed: {
    /**
     * Merged component and global Druxt.js settings for Breadcrumb component.
     */
    settings() {
      const settings = {
        component: null,
        home: null
      }

      for (const setting in settings) {
        if (typeof this.$options.propsData[setting] !== 'undefined') {
          settings[setting] = this[setting]
          continue
        }

        if (typeof this.$druxtBreadcrumb.options[setting] !== 'undefined') {
          settings[setting] = this.$druxtBreadcrumb.options[setting]
          continue
        }

        settings[setting] = this[setting]
      }

      return settings
    },

    ...mapState({
      route: state => state.druxtRouter.route,
      routes: state => state.druxtRouter.routes
    })
  },

  /**
   * Nuxt.js watch property.
   */
  watch: {
    /**
     * Updates crumbs on Route change.
     */
    $route: async function() {
      await this.fetch()
    }
  },

  created() {
    // Workaround for Vuepress docs.
    if (!this.$fetch) {
      this.fetch()
    }
  },

  methods: {
    /**
     * Fetch crumbs from Druxt.js Router.
     */
    async fetch() {
      // If there is no route, stop here.
      if (!this.route || !Object.keys(this.route).length) return

      // If we are at the root and don't want a home crumb, stop here.
      if (this.$route.path === '/' && !this.settings.home) return

      // Current route crumb.
      const crumbs = [{
        text: this.route.label
      }]

      // If we are at the root of the site, stop here.
      if (this.$route.path === '/') {
        this.crumbs = crumbs
        return
      }

      // Add crumbs for route parents.
      const paths = this.$route.path.split('/').filter(String)
      paths.pop()
      while (paths.length > 0) {
        const to = '/' + paths.join('/')

        let route
        try {
          route = await this.getRoute(to)
        } catch(err) {
          route = false
        }

        if (route.label) {
          crumbs.push({ to, text: route.label })
        }

        paths.pop()
      }

      // Home crumb.
      if (this.settings.home) {
        crumbs.push({
          to: '/',
          text: 'Home'
        })
      }

      this.crumbs = crumbs.reverse()
    },

    /**
     * Maps `druxtRouter/getRoute` Vuex action to `this.getRoute`.
     */
    ...mapActions({
      getRoute: 'druxtRouter/getRoute'
    })
  }
}
</script>
