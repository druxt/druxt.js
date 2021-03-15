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
    <img
      v-for="entity of entities"
      :key="entity.id"
      :src="entity.attributes.uri.value.replace('public://', '/sites/default/files/')"
    />
  </component>
</template>

<script>
import DruxtFieldFileDefault from './DruxtFieldFileDefault.vue'

import { mapActions } from 'vuex'

/**
 * Image field.
 *
 * _This component is intended to be rendered by the `<DruxtField />` component._
 *
 * @see {@link DruxtField}
 *
 * @todo Add an example to Image field.
 */
export default {
  name: 'DruxtFieldImage',

  /**
   * @extends DruxtFieldFileDefault
   * @see {@link DruxtFieldFileDefault}
   */
  extends: DruxtFieldFileDefault,
}
</script>
