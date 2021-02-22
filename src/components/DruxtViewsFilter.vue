<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      v-model="model"
      v-bind="component.propsData"
    />
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'

/**
 * The `<DruxtViewsFilter />` Vue.js component.
 *
 * Renders a slot themable Exposed Views filter.
 */
export default {
  name: 'DruxtViewsFilter',

  mixins: [DruxtComponentMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The Exposed Filter objects.
     *
     * @type {object[]}
     */
    filter: {
      type: Object,
      required: true,
    },

    /**
     * The DruxtViewFilter model value.
     *
     * @type {*}
     */
    value: {
      type: [Array, Number, String],
      default: undefined,
    },
  },

  data() {
    return {
      model: this.value,
    }
  },

  watch: {
    model() {
      this.$emit('input', this.model)
    }
  },

  druxt: ({ vm }) => ({
    componentOptions: [
      [vm.filter.id],
      [vm.filter.plugin_id, vm.filter.id],
      ['default']
    ],

    propsData: {
      filter: vm.filter
    }
  }),
}
</script>
