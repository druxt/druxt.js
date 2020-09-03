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
    await this.fetch()
  },

  data: () => ({
    crumbs: [],
  }),

  computed: {
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

  created() {
    if (!this.$fetch) {
      this.fetch()
    }
  },

  methods: {
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
      // console.log(paths)
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

    ...mapActions({
      getRoute: 'druxtRouter/getRoute'
    })
  },

  watch: {
    $route: async function() {
      await this.fetch()
    }
  }
}
</script>
