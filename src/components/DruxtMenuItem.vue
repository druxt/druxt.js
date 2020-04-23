<script>
export default {
  name: 'DruxtMenuItem',

  props: {
    item: {
      type: Object,
      required: true
    }
  },

  render: function(createElement) {
    let templates = {}

    templates.child = ({ entity }) => createElement('li', [
      createElement('nuxt-link', {
        props: { to: entity.attributes.url }
      }, entity.attributes.title)
    ])

    templates.parent = ({ entity, children }) => {
      const childElements = []
      for (const key in children) {
        childElements.push(createElement('druxt-menu-item', { props: { item: children[key] }}))
      }

      return createElement('li', [
        templates.child({ entity }),
        createElement('ul', childElements)
      ])
    }

    // Find parent DruxtMenu component.
    // @TODO - Error handling if not inside a DruxtMenu component.
    let menu = this.$parent
    while (menu.$options.name != 'DruxtMenu' && menu.$parent) {
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
    return templates.child({ entity: this.item.entity })
  }
}
</script>