<script>
export default {
  name: 'DruxtMenuItem',

  props: {
    item: {
      type: Object,
      required: true
    },

    itemClass: {
      type: String,
      default: ''
    },

    itemComponent: {
      type: String,
      default: 'li'
    },

    parentClass: {
      type: String,
      default: ''
    },

    parentComponent: {
      type: String,
      default: 'li'
    }
  },

  render: function(createElement) {
    const props = {
      itemClass: this.itemClass,
      itemComponent: this.itemComponent,
      parentClass: this.parentClass,
      parentComponent: this.parentComponent
    }

    let templates = {}

    templates.item = ({ entity }) => createElement(
      this.itemComponent,
      { class: this.itemClass },
      [
        createElement('nuxt-link', {
          props: { ...props, to: entity.attributes.url }
        }, entity.attributes.title)
      ]
    )

    templates.parent = ({ entity, children }) => {
      const childElements = []

      for (const key in children) {
        childElements.push(createElement('druxt-menu-item', { props: { ...props, item: children[key] }}))
      }

      return createElement(this.parentComponent, [
        createElement('druxt-menu-item', { props: { ...props, item: { children: [], entity } }}),
        createElement('ul', childElements)
      ])
    }

    // Find parent DruxtMenu component.
    let menu = this.$parent
    while (menu.$parent) {
      if (menu.$options.name === 'DruxtMenu') break
      if (menu.$options.extends && menu.$options.extends.name === 'DruxtMenu') break

      menu = menu.$parent
    }

    templates = {
      ...templates,
      ...menu.$scopedSlots
    }

    // If item has children, render as parent template.
    if (this.item.children.length) {
      return templates.parent({ entity: this.item.entity, children: this.item.children })
    }

    // Else, render as child template.
    return templates.item({ entity: this.item.entity })
  }
}
</script>