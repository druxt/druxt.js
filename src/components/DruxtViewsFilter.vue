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
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtViewsFilter />` Vue.js component.
 *
 * Renders a slot themable Exposed Views filter.
 */
export default {
  name: 'DruxtViewsFilter',

  extends: DruxtModule,

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

  druxt: {
    componentOptions: ({ filter }) => ([
      [filter.id],
      [filter.plugin_id, filter.id],
      ['default']
    ]),

    propsData: ({ filter }) => ({ filter })
  },
}
</script>
