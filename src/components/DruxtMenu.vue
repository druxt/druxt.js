<template>
  <component
    :is="component"
    v-if="items"
  >
    <druxt-menu-item
      v-for="item in items"
      :key="item.entity.id"
      :item="item"
    />
  </component>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

export default {
  name: 'DruxtMenu',

  props: {
    component: {
      type: String,
      default: 'ul'
    },

    depth: {
      type: Number,
      default: 0,
    },

    itemClass: {
      type: String,
      default: ''
    },

    itemComponent: {
      type: String,
      default: 'li'
    },

    name: {
      type: String,
      default: 'main'
    },

    parentClass: {
      type: String,
      default: ''
    },

    parentComponent: {
      type: String,
      default: 'li'
    },

    parentWrapperClass: {
      type: String,
      default: ''
    },

    parentWrapperComponent: {
      type: String,
      default: 'ul'
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
   * Used for on-demand JSON:API resource loading.
   *
   * @property {objects[]} items - The Menu items JSON:API resources.
   */
  data: () => ({
    items: [],
  }),

  computed: {
    trail() {
      const paths = []
      const parts = this.$route.path.substring(1).split('/')

      for (const key in parts) {
        const path = [key > 0 ? paths[key - 1] : '', parts[key]].join('/')
        paths.push(path)
      }

      return paths
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
    // Workaround for Vuepress docs.
    if (!this.$fetch) {
      this.fetch()
    }
  },

  methods: {
    /**
     * Fetch requested menu.
     */
    async fetch() {
      await this.getMenu(this.name)
      this.items = this.getMenuItems()
    },

    getMenuItems(entity = null, position = 0) {
      const items = []
      position += 1

      if (!this.depth || position <= this.depth) {
        let parent = null
        if (entity) {
          parent = 'menu_link_content:' + entity.id
        }

        const entities = this.getEntitiesByFilter(key => {
          return this.entities[key].attributes.menu_name === this.name && this.entities[key].attributes.parent === parent
        })

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
