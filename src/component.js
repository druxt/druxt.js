import { mapActions, mapGetters, mapState } from 'vuex'

export default {
  name: 'DruxtMenu',

  props: {
    name: {
      type: String,
      default: 'main'
    },

    depth: {
      type: Number,
      default: 2
    }
  },

  created() {
    this.getMenu(this.name).then(() => {
      this.$forceUpdate()
    })
  },

  computed: {
    items() {
      return this.getMenuItems()
    },

    ...mapGetters({
      getEntitiesByFilter: 'druxtMenu/getEntitiesByFilter'
    }),

    ...mapState({
      entities: state => state.druxtMenu.entities,
      route: state => state.druxtRouter.route
    })
  },

  methods: {
    createMenuItems(createElement, items) {
      const elements = []

      for (const key in items) {
        const item = items[key]

        let component, children
        let props = {
          to: item.entity.attributes.url
        }
        if (item.children.length) {
          component = 'b-nav-item-dropdown'
          children = this.createMenuItems(createElement, item.children)
          props.text = item.entity.attributes.title
        }

        else {
          component = 'b-nav-item'
          children = item.entity.attributes.title
        }

        elements.push(createElement(component, { props }, children))
      }

      return elements
    },

    getMenuItems(entity = null, position = 0) {
      const items = []
      position += 1

      if (position <= this.depth) {
        let parent = null
        if (entity) {
          parent = 'menu_link_content:' + entity.id
        }

        const entities = this.getEntitiesByFilter(key => this.entities[key].attributes.menu_name === this.name && this.entities[key].attributes.parent === parent)

        for (const key in entities) {
          const entity = entities[key]
          items.push({ entity, children: this.getMenuItems(entity, position)})
        }
      }

      position -= 1

      return items
    },

    ...mapActions({
      getMenu: 'druxtMenu/get'
    })
  },

  render: function (createElement) {
    const items = this.getMenuItems()
    if (!items) return

    return createElement('b-nav', this.createMenuItems(createElement, items))
  },

  watch: {
    entities() {
      this.$forceUpdate()
    }
  }
}
