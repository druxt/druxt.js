<script>
/**
 * The `<DruxtMenuItem />` Vue.js component.
 *
 * _This component is intended to be rendered by the `<DruxtMenu />` component._
 *
 * - Renders a menu item.
 */
export default {
  name: 'DruxtMenuItem',

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The menu item.
     *
     * @type {object}
     * @required
     */
    item: {
      type: Object,
      required: true
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * Current items Active state.
     *
     * @type {boolean}
     */
    active() {
      return this.menu.trail.includes(this.item.entity.attributes.url)
    },

    /**
     * Class(es) for the menu item.
     *
     * @type {string}
     */
    classes() {
      const classes = [this.menu[`${this.template}Class`]]

      if (this.active) classes.push('active-trail')

      return classes.join(' ')
    },

    /**
     * The menu item template type.
     *
     * @type {string}
     */
    template() {
      return this.item.children.length ? 'parent' : 'item'
    },

    /**
     * The `to` attribute for the menu item.
     *
     * @type {object}
     */
    to() {
      const parts = this.item.entity.attributes.link.uri.split(':')
      const type = parts[0]
      const path = parts[1]

      return { path, type }
    },

    /**
     * The parent DruxtMenu component, if present.
     *
     * @type {@object}
     */
    menu() {
      let menu = false

      let item = this.$parent
      while (item && !menu) {
        if (item.$options.name === 'DruxtMenu') menu = item
        if (item.$options.extends && item.$options.extends.name === 'DruxtMenu') menu = item

        item = item.$parent ? item.$parent : false
      }

      return menu
    }
  },

  methods: {
    /**
     * The menu item template functions.
     */
    templates: function(createElement) {
      return {
        // Default template for Item slot.
        item: ({ item: { entity } }) => createElement(
          this.menu.itemComponent,
          { class: this.classes },
          [
            createElement('nuxt-link', { props: { to: this.to } }, entity.attributes.title)
          ]
        ),

        // Default tempalte for Parent slot.
        parent: ({ item: { entity, children } }) => {
          const childElements = []

          for (const key in children) {
            childElements.push(createElement('druxt-menu-item', { props: { item: children[key] }}))
          }

          return createElement(this.menu.parentComponent,
            { class: this.classes },
            [
              createElement('druxt-menu-item', { props: { item: { children: [], entity } }}),
              createElement(this.menu.parentWrapperComponent, { class: this.menu.parenWrapperClass }, childElements)
            ]
          )
        },

        ...this.menu.$scopedSlots
      }
    }
  },

  /**
   * The Vue.js render function.
   */
  render: function(createElement) {
    if (!this.menu) return false
    return this.templates(createElement)[this.template](this)
  }
}
</script>
