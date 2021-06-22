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

  /** */
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
  },

  watch: {
    model(to, from) {
      if (to !== from) {
        this.$emit('input', this.model)
      }
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
