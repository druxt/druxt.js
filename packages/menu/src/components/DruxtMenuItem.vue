<script>
import { getMenuLinkUrl, resolveMenuLink } from 'druxt-menu'

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
     * The frontend URL. Absolute menu links to this host use the frontend
     * router.
     *
     * Read from the request headers during server rendering, and from the
     * window location in the browser.
     *
     * @type {string|undefined}
     */
    frontendUrl: ({ $ssrContext }) => {
      const { headers } = ($ssrContext || {}).req || {}
      if (headers) {
        const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim()
        return host ? `//${host}` : undefined
      }

      return typeof window !== 'undefined' ? window.location.origin : undefined
    },

    /**
     * The parent DruxtMenu component, if present.
     *
     * @type {object|boolean}
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
     * The `to` attribute for the menu item, or `false` if the menu item is
     * not a frontend route.
     *
     * @type {object|boolean}
     */
    to: ({ item, resolveLink }) => resolveLink(item.entity).to || false
  },

  methods: {
    /**
     * Resolves how a menu item entity links to its URL.
     *
     * @param {object} [entity] - The menu item entity.
     *
     * @returns {object} The link: `to` for the frontend router, `href` for a plain link, or neither for text.
     */
    resolveLink(entity) {
      return resolveMenuLink(getMenuLinkUrl((entity || {}).attributes), {
        baseUrl: ((this.$druxt || {}).settings || {}).baseUrl,
        frontendUrl: this.frontendUrl,
      })
    },

    /**
     * Returns a menu link component.
     *
     * @param {Function} h - The Vue createElement function.
     * @param {object} entity - The menu item entity.
     */
    getLink(h, entity = {}) {
      if (!entity.attributes) return false

      const { href, to } = this.resolveLink(entity)

      // Render internal links.
      if (to) {
        return h('nuxt-link', { props: { to } }, entity.attributes.title)
      }

      // Render external links and Drupal files.
      if (href) {
        return h('a', { domProps: { href } }, entity.attributes.title)
      }

      // Render menu items without a URL, such as <nolink>, as text.
      return h('span', entity.attributes.title)
    },

    /**
     * The menu item template functions.
     *
     * @param {Function} h - The Vue createElement function.
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
   *
   * @param {Function} h - The Vue createElement function.
   */
  render(h) {
    if (!this.menu) return false
    return this.templates(h)[this.template](this)
  }
}
</script>
