<script>
export default {
  name: 'DruxtMenuItem',

  props: {
    item: {
      type: Object,
      required: true
    }
  },

  computed: {
    active() {
      return this.menu.trail.includes(this.item.entity.attributes.url)
    },

    classes() {
      const classes = [this.menu[`${this.template}Class`]]

      if (this.active) classes.push('active-trail')

      return classes.join(' ')
    },

    template() {
      return this.item.children.length ? 'parent' : 'item'
    },

    // The parent <DruxtMenu> component, if present.
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
    templates: function(createElement) {
      return {
        // Default template for Item slot.
        item: ({ item: { entity } }) => createElement(
          this.menu.itemComponent,
          { class: this.classes },
          [
            createElement('nuxt-link', { props: { to: entity.attributes.url } }, entity.attributes.title)
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

  render: function(createElement) {
    if (!this.menu) return false
    return this.templates(createElement)[this.template](this)
  }
}
</script>