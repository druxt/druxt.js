<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$scopedSlots['label-above']">
      <slot name="label-above" />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$scopedSlots['label-inline']"
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
import { DruxtFieldMixin } from 'druxt-entity'

import { mapActions } from 'vuex'

/**
 * Renders an entity reference field as the referenced entities' labels, optionally linked.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:1.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
 */
export default {
  name: 'DruxtFieldEntityReferenceLabel',

  mixins: [DruxtFieldMixin],

  /**
   * Provides the referenced entities' label and link data for rendering.
   *
   * @property {string} [component=span] - The component used to wrap the field items.
   * @property {boolean|object} entities - The label text and link props per referenced entity, or `false` until fetched.
   * @property {boolean} loading - Loading status.
   */
  data: () => ({
    component: 'span',
    entities: false,
    loading: false
  }),

  async fetch() {
    for (const delta in this.items) {
      const item = this.items[delta]

      const result = await this.getResource({ id: item.uuid, type: item.type })
      if (!(result || {}).data) return

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

  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },

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
