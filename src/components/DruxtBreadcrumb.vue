<script>
import { mapActions, mapState } from 'vuex'

export default {
  name: 'DruxtBreadcrumb',

  props: {
    component: {
      type: String,
      default: function() {
        // @TODO - Get default from site configuration.
        return 'div'
      }
    }
  },

  created() {
    this.getItems()
  },

  data: () => ({
    loading: 0,
    items: {},
  }),

  computed: {
    crumbs() {
      if (!!this.loading) return []

      return Object.keys(this.items).sort((a, b) => a.length - b.length).map(key => {
        return this.items[key]
      })
    },

    ...mapState({
      route: state => state.druxtRouter.route,
      routes: state => state.druxtRouter.routes
    })
  },

  methods: {
    getItems() {
      // Reset items.
      this.items = {}

      // If there is no route, stop here.
      if (!this.route || !Object.keys(this.route).length) return

      // Home crumb.
      // @TODO - Make this configurable.
      this.items['/'] = {
        to: '/',
        text: 'Home'
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
        this.loading++
        const to = '/' + paths.join('/')
        this.items[to] = {}

        this.getRoute(to).then((route) => {
          this.loading--

          delete this.items[to]
          if (route.label) {
            this.items[to] = { to, text: route.label }
          }

          this.$forceUpdate()
        }).catch(error => {
          this.loading--
          delete this.items[to]
        })

        paths.pop()
      }
    },

    ...mapActions({
      getRoute: 'druxtRouter/getRoute'
    })
  },

  watch: {
    '$route': 'getItems'
  },

  render: function (createElement) {
    if (this.crumbs.length === 0) return

    // @TODO - Make component configurable.
    return createElement(this.component, {
      props: {
        items: this.crumbs
      }
    })
  }
}
</script>
