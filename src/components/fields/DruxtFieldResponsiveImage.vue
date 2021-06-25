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
    />
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../../mixins/field'

import { mapActions } from 'vuex'

/**
 * Responsive Image field.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @example @lang vue
 * <DruxtField
 *   :data="{
 *     data: {
 *       id: '5724adfc-0659-41ac-a186-56c527aefdf4',
 *       meta: {
 *         alt: 'Cheesy pasta dish with vegetarian sausages and topped with mozzarella cheese and basil',
 *         height: 511,
 *         title: null,
 *         width: 768
 *       },
 *       type: 'file--file'
 *     }
 *   }"
 *   :schema="{
 *     id: 'field_media_image',
 *     settings: {
 *       display: {
 *         image_link: '',
 *         responsive_image_style: '3_2_image',
 *       }
 *     },
 *     type: 'responsive_image'
 *   }"
 * />
 */
export default {
  name: 'DruxtFieldResponsiveImage',

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

<style scoped>
img {
  width: 100%;
}
</style>
