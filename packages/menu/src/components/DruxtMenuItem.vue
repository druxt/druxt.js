<script>
/**
 * Used by the DruxtMenu component to render individual Druxt Wrapper themeable
 * menu items.
 */
export default {
  name: 'DruxtMenuItem',

  /** */
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

  /** */
  computed: {
    /**
     * Current items Active state.
     *
     * @type {boolean}
     */
    active: ({ item, menu }) => menu.trail.includes(item.entity.attributes.url),

    /**
     * Class(es) for the menu item.
     *
     * @type {string}
     */
    classes: ({ active, menu, template }) => {
      const classes = [menu[`${template}Class`]]

      if (active) classes.push('active-trail')

      return classes.join(' ')
    },

    /**
     * The parent DruxtMenu component, if present.
     *
     * @type {@object}
     */
    menu: ({ $parent }) => {
      let menu = false

      let item = $parent
      while (item && !menu) {
        if (item.$options.name === 'DruxtMenu') menu = item
        if (item.$options.extends && item.$options.extends.name === 'DruxtMenu') menu = item

        item = item.$parent ? item.$parent : false
      }

      return menu
    },

    /**
     * The menu item template type.
     *
     * @type {string}
     */
    template: ({ item }) => (item.children || []).length ? 'parent' : 'item',

    /**
     * The `to` attribute for the menu item.
     *
     * @type {object}
     */
    to: ({ item }) =>
      ((item.entity.attributes.link || {}).uri || '').startsWith('internal:')
      && (!item.entity.attributes.route || item.entity.attributes.route.name)
        ? { path: item.entity.attributes.link.uri.split(':')[1] }
        : false
  },

  methods: {
    /**
     * Returns a menu link components.
     */
    getLink(h, entity = {}) {
      if (!entity.attributes) return false

      // Render external links.
      if (!this.to) {
        return h('a',
          { domProps: { href: entity.attributes.url || (entity.attributes.link || {}).uri }},
          entity.attributes.title
        )
      }

      // Render internal links.
      return h('nuxt-link',
        { props: { to: this.to } },
        entity.attributes.title
      )
    },

    /**
     * The menu item template functions.
     */
    templates(h) {
      return {
        // Default template for Item slot.
        item: ({ item: { entity } }) => h(this.menu.itemComponent,
          { class: this.classes },
          [this.getLink(h, entity)]
        ),

        // Default template for Parent slot.
        parent: ({ item: { entity, children } }) => {
          const childElements = []

          for (const key in children) {
            childElements.push(h('druxt-menu-item', { props: { item: children[key] }}))
          }

          return h(this.menu.parentComponent,
            { class: this.classes },
            [
              this.getLink(h, entity),
              h(this.menu.parentWrapperComponent,
                { class: this.menu.parenWrapperClass },
                childElements
              )
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
  render(h) {
    if (!this.menu) return false
    return this.templates(h)[this.template](this)
  }
}
</script>
