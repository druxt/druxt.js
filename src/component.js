import { mapActions, mapGetters, mapState } from 'vuex'

export default {
  name: 'DruxtMenu',

  props: {
    name: {
      type: String,
      default: 'main'
    }
  },

  created() {
    this.getMenu(this.name).then(() => {
      this.$forceUpdate()
    })
  },

  computed: {
    ...mapGetters({
      getEntitiesByFilter: 'druxtMenu/getEntitiesByFilter'
    }),

    ...mapState({
      entities: state => state.druxtMenu.entities,
      route: state => state.druxtRouter.route
    })
  },

  methods: {
    createMenuItems(createElement, entity = null, props = {}) {
      let children = []

      let parent = null
      if (entity) {
        parent = 'menu_link_content:' + entity.id
      }

      const entities = this.getEntitiesByFilter(key => this.entities[key].attributes.menu_name === this.name && this.entities[key].attributes.parent === parent)

      for (const key in entities) {
        const child = entities[key]
        children.push(this.createMenuItems(createElement, child, { to: child.attributes.url }))
      }

      // @TODO - Make components configurable.
      let component = 'b-nav-item'
      if (children.length && entity) {
        component = 'b-nav-item-dropdown'
        props.text = entity.attributes.title
      }
      else if (children.length && !entity) {
        component = 'b-nav'
      }
      else if (entity) {
        children = entity.attributes.title
      }

      return createElement(component, { props }, children)
    },

    ...mapActions({
      getMenu: 'druxtMenu/get'
    })
  },

  render: function (createElement) {
    return this.createMenuItems(createElement)
  }
}
