<template>
  <component
    :is="wrapper.component"
    v-if="entities && typeof entities[0] !== 'undefined'"
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
 * _This component is intended to be rendered by the `<druxt-field />` component._
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
   * Loads all referenced entities via `druxtRouter/getEntity`.
   *
   * @see {@link https://router.druxtjs.org/api/stores/router.html#module_druxtRouter..getEntity}
   */
  async fetch() {
    for (const delta in this.items) {
      const item = this.items[delta]
      this.entities[delta] = await this.getEntity({ id: item.uuid, type: item.type })
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
     * Maps `druxtRouter/getEntity` Vuex action to `this.getEntity`.
     */
    ...mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}
</script>
