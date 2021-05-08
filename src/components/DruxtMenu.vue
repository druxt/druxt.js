<script>
import merge from 'deepmerge'
import { DruxtModule } from 'druxt'
import { mapActions, mapGetters, mapState } from 'vuex'

/**
 * The `<DruxtMenu />` Vue.js component.
 *
 * - Fetchs the menu items via the DruxtClient.
 * - Renders the data via the DruxtMenuItem component.
 *
 * @example @lang vue
 * <DruxtMenu name="main" />
 */
export default {
  name: 'DruxtMenu',

  extends: DruxtModule,

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
     * The maximum depth of the menu tree.
     * 
     * @type {integer}
     */
    maxDepth: {
      type: Number,
      default: null,
    },

    /**
     * The minimum depth of the menu tree.
     * 
     * @type {Integer}
     * @default 0
     */
    minDepth: {
      type: Number,
      default: 0,
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
     * The menu parent ID.
     * 
     * @type String
     */
    parentId: {
      type: String,
      default: null,
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
     * @default li
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
    // Build wrapper component object.
    const options = this.getModuleComponents()
    let component = {
      is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
      options: options.map(o => o.name) || [],
    }

    // Get wrapper component data to merge with module settings.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = merge(((this.$druxtMenu || {}).options || {}).menu || {}, wrapperData.druxt || {}, { arrayMerge: (dest, src) => src })

    const settings = {
      ...(component.settings || {}).query,
      max_depth: this.maxDepth || this.depth,
      min_depth: this.minDepth,
      parent: this.parentId,
    }

    await this.getMenu({
      name: this.name,
      settings,
    })
    this.items = this.getMenuItems()

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
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
        let parent = this.parentId || null
        if (entity) {
          parent = entity.id

          // Ensure that the parent is prefixed correctly if we're not using the JSON:API Menu Items module.
          if (typeof entity.attributes.bundle !== 'undefined') {
            parent = [entity.attributes.bundle, entity.id].join(':')
          }
        }

        const entities = this.getEntitiesByFilter((key) => {
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
     * Provides the scoped slots object for the Module render function.
     *
     * Adds a `default` slot that will render the menu tree using the
     * DruxtMenuItem component.
     * 
     * @example <caption>DruxtMenu**Name**.vue</caption> @lang vue
     * <template>
     *   <div>
     *     <slot />
     *   </div>
     * </template>
     *
     * @return {ScopedSlots} The Scoped slots object.
     */
    getScopedSlots() {
      return {
        default: (attrs) => this.items.map((item) => this.$createElement('DruxtMenuItem', {
          attrs,
          key: item.entity.id,
          props: {
            item,
          },
        })),
        ...this.$scopedSlots,
      }
    },

    /**
     * Maps `druxtMenu/get` Vuex action to `this.getMenu`.
     */
    ...mapActions({
      getMenu: 'druxtMenu/get'
    })
  },

  /**
   * Druxt module configuration.
   */
  druxt: {
    /**
     * Provides the available component naming options for the Druxt Wrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ name }) => [[name], ['default']],

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ items }) => ({ items }),
  },
}

/**
 * Provides the available naming options for the Wrapper component.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtMenu[Name]',
 *   'DruxtMenuDefault',
 * ]
 *
 * @example <caption>Main menu (default)</caption> @lang js
 * [
 *   'DruxtMenuMain',
 *   'DruxtMenuDefault',
 * ]
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object[]} items - The Menu items structured data.
 *
 * @example @lang js
 * {
 *   items: [
 *     {
 *       children: [],
 *       entity: {},
 *     },
 *   ],
 * }
 */

/**
 * Provides scoped slots for use in the Wrapper component.
 *
 * @typedef {object} ScopedSlots
 * @param {function} default - All menu items using the DruxtMenuItem component
 *
 * @example <caption>DruxtMenu**Name**.vue</caption> @lang vue
 * <template>
 *   <div>
 *     <slot />
 *   </div>
 * </template>
 */
</script>
