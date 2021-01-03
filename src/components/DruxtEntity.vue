<script>
import { DruxtComponentMixin } from 'druxt'
import { DruxtRouterEntityMixin } from 'druxt-router'
import { DruxtSchemaMixin } from 'druxt-schema'
import { mapActions } from 'vuex'

/**
 * The `<druxt-entity />` Vue.js component.
 *
 * - Loads a Drupal Entity JSON:API resource from the DruxtJS Router.
 * - Loads the DruxtJS Schema for the Drupal display mode.
 * - Renders Field data via the `<druxt-field />` component.
 * - Supports Component Suggestion based theming with Vue.js Slots.
 *
 * @example @lang vue
 * <!-- Render the specified Aritcle node with with Teaser display mode. -->
 * <druxt-entity type="node--article" :uuid="uuid" :mode="teaser" />
 *
 * @see {@link DruxtField}
 * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
 */
export default {
  name: 'DruxtEntity',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://router.druxtjs.org/api/mixins/entity.html|DruxtRouterEntityMixin}
   * @see DruxtSchemaMixin.
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtComponentMixin, DruxtRouterEntityMixin, DruxtSchemaMixin],

  /**
   * Nuxt.js fetch method.
   *
   * @see {@link https://nuxtjs.org/api/pages-fetch/}
   */
  async fetch() {
    // Fetch Entity resource.
    await DruxtRouterEntityMixin.fetch.call(this)

    // Fetch Schema.
    await DruxtSchemaMixin.fetch.call(this)

    // Generate fields list.
    this.fields = this.getFields()

    // Fetch Druxt theme component.
    await DruxtComponentMixin.fetch.call(this)
  },

  data: () => ({
    fields: {}
  }),

  druxt: ({ vm }) => ({
    componentOptions: [
      [vm.schema.resourceType, vm.schema.config.mode],
      [vm.schema.resourceType],
      [vm.schema.config.mode],
    ],

    propsData: {
      entity: vm.entity,
      fields: vm.fields,
      schema: vm.schema
    },
  }),

  methods: {
    getFields() {
      if (!this.entity || !this.schema) return false

      const data = {
        ...this.entity.attributes,
        ...this.entity.relationships
      }

      const fields = {}
      for (const field of this.schema.fields) {
        // Filter out empty fields.
        if (this.isEmpty(data[field.id])) continue

        fields[field.id] = {
          id: field.id,
          data: data[field.id],
          schema: field,
          relationship: !!this.entity.relationships[field.id]
        }
      }

      return fields
    },

    /**
     * Checks if an Entity field is empty.
     *
     * @param {*} value - Field value.
     * @return {boolean}
     */
    isEmpty(value) {
      if (typeof value === 'undefined') return true

      if (!value) return true

      if (Array.isArray(value.data) && !value.data.length) return true

      if (typeof value.data !== 'undefined' && !value.data) return true

      return false
    }
  },

  render(h) {
    const wrapperData = {
      class: this.wrapper.class || undefined,
      style: this.wrapper.style || undefined,
      props: this.wrapper.propsData,
    }

    // Return only wrapper if fetch state is still pending.
    if (this.$fetchState.pending) {
      return h(this.wrapper.component, wrapperData)
    }

    // Build scoped slots for each field.
    const scopedSlots = {}
    Object.entries(this.fields).map(([id, field]) => {
      scopedSlots[id] = attrs => h('DruxtField', { attrs, props: field })
    })

    // Build default slot.
    scopedSlots.default = attrs => Object.entries(this.fields).map(([id]) => scopedSlots[id](attrs))

    // Return wrapped component.
    return h(this.wrapper.component, wrapperData, [
      h(this.component.is, {
        attrs: this.$attrs,
        props: this.component.propsData,
        scopedSlots,
      })
    ])
  }
}
</script>
