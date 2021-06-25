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
    <nuxt-link
      v-for="entity of entities"
      :key="entity.id"
      :to="entity.attributes.uri.value.replace('public://', '/sites/default/files/')"
    >
      {{ entity.attributes.filename }}
    </nuxt-link>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

import { mapActions } from 'vuex'

/**
 * File Default field.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @todo Add an example to File Default field.
 */
export default {
  name: 'DruxtFieldFileDefault',

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
      const resource = await this.getResource({ id: item.uuid, type: item.type })
      this.entities[delta] = resource.data
    }
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {object[]} entities
   */
  data: () => ({
    entities: []
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
