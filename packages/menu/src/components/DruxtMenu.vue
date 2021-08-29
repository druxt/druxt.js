<script>
import merge from 'deepmerge'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions, mapGetters, mapState } from 'vuex'

/**
 * Renders a Drupal menu using either the default Drupal content menus, or the
 * full menu via the JSON:API Menu Items module.
 *
 * @example @lang vue
 * <DruxtMenu name="main" />
 */
export default {
  name: 'DruxtMenu',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * The depth of the menu items to render.
     *
     * @example @lang vue
     * <DruxtMenu :depth="1" />
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
     * The maximum depth of the menu tree data to load.
     *
     * @example @lang vue
     * <DruxtMenu :max-depth="4" />
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
     * @example @lang vue
     * <DruxtMenu :min-depth="2" />
     *
     * @type {Integer}
     * @default 0
     */
    minDepth: {
      type: Number,
      default: 0,
    },

    /**
     * The name of the menu to load and render.
     *
     * @example @lang vue
     * <DruxtMenu name="main" />
     *
     * @type {string}
     * @default main
     */
    name: {
      type: String,
      default: 'main'
    },

    /**
     * The menu parent ID to use as the root of the menu.
     *
     * @example @lang vue
     * <DruxtMenu parent-id="views_view:views.recipes.page_1" />
     *
     * @type {string}
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
   *
   * Builds and executes the JSON:API query, loading the menu items into the
   * druxtMenu Vuex store.
   */
  async fetch() {
    // Build wrapper component object.
    const options = this.getModuleComponents()
    let component = {
      is: (((options.filter(o => o.global) || [])[0] || {}).name || 'DruxtWrapper'),
      options: options.map(o => o.name) || [],
    }

    // Get scoped slots.
    component.slots = Object.keys(this.getScopedSlots())

    // Get wrapper component data to merge with module settings.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = merge(((this.$druxtMenu || {}).options || {}).menu || {}, wrapperData.druxt || {}, { arrayMerge: (dest, src) => src })

    const settings = {
      ...(component.settings || {}).query,
      max_depth: this.maxDepth || this.depth,
      min_depth: this.minDepth,
      parent: this.parentId,
    }

    if (!this.value) {
      await this.getMenu({
        name: this.name,
        settings,
      })
      this.model = this.getMenuItems()
    }

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  fetchKey(getCounter) {
    const parts = ['DruxtMenu', this.name, this.parentId].filter((o) => o)
    return [...parts, getCounter(parts.join(':'))].join(':')
  },

  /** */
  computed: {
    /**
     * The processed Menu items.
     *
     * @type {objects[]}
     * @deprecated
     */
    items: ({ model }) => model,

    /**
     * The active route trail.
     *
     * @type {string[]}
     */
    trail: ({ $route }) => {
      const paths = []
      const parts = $route.path.substring(1).split('/')

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

  /** */
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
     * Maps `druxtMenu/get` Vuex action to `this.getMenu`.
     */
    ...mapActions({
      getMenu: 'druxtMenu/get'
    })
  },

  /** DruxtModule settings. */
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
    propsData: ({ model, parentId }) => ({ items: model, parentId, value: model }),

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
    slots(h) {
      return {
        default: (attrs) => this.items.map((item) => h('DruxtMenuItem', {
          attrs,
          key: item.entity.id,
          props: {
            item,
          },
        })),
      }
    },
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
 * Provides settings for the Menu module, via the `nuxt.config.js` `druxt.menu`
 * or the Wrapper component `druxt` object.
 *
 * @typedef {object} ModuleSettings
 * @param {string[]} fields - An array of fields to filter all JSON:API Menu queries.
 * @param {boolean} requiredOnly - Whether to automatically filter to module defined minimum required fields.
 *
 * @example @lang js
 * {
 *   fields: [],
 *   requiredOnly: true,
 * }
 *
 * @example @lang vue
 * <script>
 * export default {
 *   druxt: {
 *     query: {
 *       fields: ['description', 'options']
 *       requiredOnly: false,
 *     },
 *   }
 * }
 */

/**
 * Provides propsData for use in the Wrapper component.
 *
 * @typedef {object} PropsData
 * @param {object[]} items - The Menu items structured data.
 * @param {object[]} value - The Menu items structured data.
 *
 * @example @lang js
 * {
 *   items: [
 *     {
 *       children: [],
 *       entity: {},
 *     },
 *   ],
 *   value: [
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
