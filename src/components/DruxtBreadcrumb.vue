<template>
  <component
    :is="settings.component"
    v-if="crumbs.length"
    :items="crumbs"
  />
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  name: 'DruxtBreadcrumb',

  props: {
    component: {
      type: String,
      default: 'div'
    },

    home: {
      type: Boolean,
      default: true
    }
  },

  async fetch() {
    // Reset items.
    this.items = {}

    // If there is no route, stop here.
    if (!this.route || !Object.keys(this.route).length) return

    // Home crumb.
    if (this.settings.home) {
      this.items['/'] = {
        to: '/',
        text: 'Home'
      }
    }

    // If we are at the root of the site, stop here.
    if (this.$route.path === '/') return

    // Current route crumb.
    this.items[this.$route.path] = {
      text: this.route.label
    }

    // Add crumbs for route parents.
    const paths = this.$route.path.split('/').filter(String)
    paths.pop()
    while (paths.length > 0) {
      const to = '/' + paths.join('/')

      const route = await this.getRoute(to)
      if (route.label) {
        this.items[to] = { to, text: route.label }
      }

      paths.pop()
    }
  },

  data: () => ({
    items: {},
  }),

  computed: {
    crumbs() {
      return Object.keys(this.items).sort((a, b) => a.length - b.length).map(key => {
        return this.items[key]
      })
    },

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

  methods: {
    ...mapActions({
      getRoute: 'druxtRouter/getRoute'
    })
  }
}
</script>
