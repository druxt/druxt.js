<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$slots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$slots['label-inline']"
      name="label-inline"
    />

    <!-- Items -->
    <component
      :is="component"
      v-for="(entity, key) of entities"
      :key="key"
      v-bind="entity.props || false"
    >
      {{ entity.text }}
    </component>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

import { mapActions } from 'vuex'

/**
 * Entity Reference Label field.
 *
 * _This component is intended to be rendered by the `<druxt-field />` component._
 *
 * @see {@link DruxtField}
 *
 * @example @lang vue
 * <druxt-field
 *   :data="{
 *     data: [{
 *       id: 'e2608d8f-093b-46df-be4c-913ee650f5c7',
 *       type: 'taxonomy_term--recipe_category'
 *     }]
 *   }"
 *   :schema="{
 *     id: 'field_recipe_category',
 *     type: 'entity_reference_label'
 *   }"
 * />
 */
export default {
  name: 'DruxtFieldEntityReferenceLabel',

  /**
   * Vue.js Mixins.
   *
   * @see {@link ../mixins/field|DruxtFieldMixin}
   * @see {@link https://vuejs.org/v2/guide/mixins.html}
   */
  mixins: [DruxtFieldMixin],

  /**
   * Loads all referenced entities via `druxt/getResource`.
   */
  async fetch() {
    for (const delta in this.items) {
      const item = this.items[delta]

      const result = await this.getResource({ id: item.uuid, type: item.type })
      if (!this.entities) this.entities = []

      this.entities[delta] = {
        props: false,
        text: result.data.attributes[Object.keys(result.data.attributes).find(e => ['name', 'title'].includes(e))]
      }

      if (((this.schema.settings || {}).display || {}).link && result.data.attributes.path.alias) {
        this.component = 'nuxt-link'
        this.entities[delta].props = {
          to: result.data.attributes.path.alias
        }
      }
    }
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {string} component=span - The component used to wrap the field items.
   * @property {boolean|object} entities
   * @property {boolean} loading - Loading status.
   */
  data: () => ({
    component: 'span',
    entities: false,
    loading: false
  }),

  methods: {
    /**
     * Maps `druxt/getResource` Vuex action to `this.getResource`.
     */
    ...mapActions({
      getResource: 'druxt/getResource'
    })
  }
}
</script>
