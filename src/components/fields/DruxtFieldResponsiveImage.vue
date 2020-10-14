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
 * _This component is intended to be rendered by the `<druxt-field />` component._
 *
 * @see {@link DruxtField}
 *
 * @example @lang vue
 * <druxt-field
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

<style scoped>
img {
  width: 100%;
}
</style>
