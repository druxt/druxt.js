<script>
import merge from 'deepmerge'
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
import { mapActions, mapGetters, mapState } from 'vuex'

/**
 * The DruxtMenu component renders a Drupal menu using either the default
 * Drupal content menus, or the full menu via the JSON:API Menu Items module.
 *
 * @example @lang vue
 * <DruxtMenu name="main" />
 *
 * @example <caption>DruxtMenu Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="items" />
 * </template>
 *
 * <script>
 * import { DruxtMenuMixin } from 'druxt-menu'
 * export default {
 *   mixins: [DruxtMenuMixin]
 * }
 *
 * @example <caption>DruxtMenu with template injection</caption> @lang vue
 * <DruxtMenu>
 *   <template #default="{ items }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="items" />
 *   </template>
 * </DruxtMenu>
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
     * @type {number}
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
     * The entity langcode.
     */
    langcode: {
      type: String,
      default: undefined
    },

    /**
     * The maximum depth of the menu tree data to load.
     *
     * @example @lang vue
     * <DruxtMenu :max-depth="4" />
     *
     * @type {number}
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
     * @type {number}
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
    async $route(to, from) {
      if (this.langcode) return
      if ((to.meta || {}).langcode !== (from.meta || {}).langcode) {
        await this.$fetch()
      }
    },

    /**
     * Updates menu when available Entities change.
     */
    entities() {
      this.$forceUpdate()
    },

    async langcode() {
      await this.$fetch()
    }
  },

  methods: {
    /**
     * Recursively gets required menu items from the Vuex store.
     *
     * @param {object} [entity] - Current menu item entity.
     * @param {number} [position] - Current position in the menu tree,
     */
    getMenuItems(entity = null, position = 0) {
      const langcode = this.langcode || (this.$route.meta || {}).langcode
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

        const entities = this.getEntitiesByFilter({
          filter: (key) => {
            return this.entities[langcode][key].attributes.menu_name === this.name && this.entities[langcode][key].attributes.parent === parent
          },
          prefix: langcode
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
     * Builds and executes the JSON:API query, loading the menu items into the
     * druxtMenu Vuex store.
     */
    async fetchData(settings) {
      if (!this.value) {
        await this.getMenu({
          name: this.name,
          settings: settings.query,
          prefix: this.langcode || (this.$route.meta || {}).langcode
        })
        this.model = this.getMenuItems()
      }
    },

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ model, parentId }) => ({ items: model, parentId, value: model }),

    /**
     * Component settings.
     */
    settings: ({ $druxt, depth, maxDepth, minDepth, parentId }, wrapperSettings) => {
      const settings = merge($druxt.settings.menu || {}, wrapperSettings, { arrayMerge: (dest, src) => src })
      return {
        query: {
          ...(settings.query || {}),
          max_depth: maxDepth || depth,
          min_depth: minDepth,
          parent: parentId,
        }
      }
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
    slots(h) {
      return {
        default: (attrs) => (this.items || []).map((item) => h('DruxtMenuItem', {
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
