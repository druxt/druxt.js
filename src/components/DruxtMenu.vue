<template>
  <component
    :is="component"
    v-if="getMenuItems()"
  >
    <druxt-menu-item
      v-for="item in getMenuItems()"
      :key="item.entity.id"
      :children="item.children"
      :item="item"
    />
  </component>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

export default {
  name: 'DruxtMenu',

  props: {
    name: {
      type: String,
      default: 'main'
    },

    component: {
      type: String,
      default: 'ul'
    },

    depth: {
      type: Number,
      default: 0,
    }
  },

  computed: {
    items() {
      return this.getMenuItems()
    },

    ...mapGetters({
      getEntitiesByFilter: 'druxtMenu/getEntitiesByFilter'
    }),

    ...mapState({
      entities: state => state.druxtMenu.entities
    })
  },

  watch: {
    entities() {
      this.$forceUpdate()
    }
  },

  created() {
    this.getMenu(this.name).then(() => {
      this.$forceUpdate()
    })
  },

  methods: {
    getMenuItems(entity = null, position = 0) {
      const items = []
      position += 1

      if (!this.depth || position <= this.depth) {
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
  }
}
</script>
