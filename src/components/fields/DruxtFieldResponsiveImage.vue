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
    <img
      v-for="entity of entities"
      :key="entity.id"
      :src="entity.attributes.uri.value.replace('public://', '/sites/default/files/')"
    >
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

import { mapActions } from 'vuex'

/**
 * Responsive Image field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldResponsiveImage',

  mixins: [DruxtFieldMixin],

  async fetch() {
    for (const delta in this.items) {
      const item = this.items[delta]
      const resource = await this.getResource({ id: item.uuid, type: item.type })
      this.entities[delta] = resource.data
    }
  },

  /**
   * @property {object[]} entities
   */
  data: () => ({
    entities: []
  }),

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

<style scoped>
img {
  width: 100%;
}
</style>
