<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      v-bind="component.propsData"
    >
      <template #default="$attrs">
        <DruxtMenuItem
          v-for="item in items"
          :key="item.entity.id"
          :item="item"
          v-bind="$attrs"
        />
      </template>
    </component>
  </component>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { DruxtComponentMixin } from 'druxt'

/**
 * The `<DruxtMenu />` Vue.js component.
 *
 * - Fetchs the menu items via the DruxtJS Router.
 * - Renders the data via the DruxtMenuItem component.
 *
 * @example @lang vue
 * <DruxtMenu name="main" />
 */
export default {
  name: 'DruxtMenu',

  mixins: [DruxtComponentMixin],

  druxt: ({ vm }) => ({
    componentOptions: [[vm.name]],
    propsData: {
      items: vm.items
    }
  }),

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The maximum depth of the menu.
     *
     * @type {integer}
     * @default 0
     */
    depth: {
      type: Number,
      default: 0,
    },

    /**
     * Class(es) to apply to the menu items.
     *
     * @type {string}
     */
    itemClass: {
      type: String,
      default: ''
    },

    /**
     * Component or element to render the menu items.
     *
     * @type {string}
     * @default li
     */
    itemComponent: {
      type: String,
      default: 'li'
    },

    /**
     * The name of the menu to render.
     *
     * @type {string}
     * @default main
     */
    name: {
      type: String,
      default: 'main'
    },

    /**
     * Class(es) to apply to parent menu items.
     *
     * @type {string}
     */
    parentClass: {
      type: String,
      default: ''
    },

    /**
     * Component or element to render parent menu items.
     *
     * @type {string}
     * @default lit
     */
    parentComponent: {
      type: String,
      default: 'li'
    },

    /**
     * Class(es) to apply to a wrapper around parent menu items.
     *
     * @type {string}
     */
    parentWrapperClass: {
      type: String,
      default: ''
    },

    /**
     * Component or element to render a wrapper around parent menu items.
     *
     * @type {string}
     * @default ul
     */
    parentWrapperComponent: {
      type: String,
      default: 'ul'
    }
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    await this.getMenu(this.name)
    this.items = this.getMenuItems()

    // Fetch theme component.
    await DruxtComponentMixin.fetch.call(this)
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

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The active route trail.
     */
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

  /**
   * Nuxt.js watch property.
   */
  watch: {
    /**
     * Updates menu when available Entities change.
     */
    entities() {
      this.$forceUpdate()
    }
  },

  methods: {
    /**
     * Recursively gets required menu items from the Vuex store.
     *
     * @param {object} [entity] - Current menu item entity.
     * @param {integer} [position] - Current position in the menu tree,
     */
    getMenuItems(entity = null, position = 0) {
      const items = []
      position += 1

      if (!this.depth || position <= this.depth) {
        let parent = null
        if (entity) {
          parent = entity.id

          // Ensure that the parent is prefixed correctly if we're not using the JSON:API Menu Items module.
          if (typeof entity.attributes.bundle !== 'undefined') {
            parent = [entity.attributes.bundle, entity.id].join(':')
          }
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

    /**
     * Maps `druxtMenu/get` Vuex action to `this.getMenu`.
     */
    ...mapActions({
      getMenu: 'druxtMenu/get'
    })
  }
}
</script>
