<template>
  <component :is="component.is" v-bind="component.propsData">
    {{ text }}
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'

export default {
  name: 'DruxtCustomModule',

  mixins: [DruxtComponentMixin],

  props: {
    text: {
      type: String,
      default: ''
    }
  },

  druxt: ({ vm }) => ({
    componentOptions: [['wrapper']],
  }),
}
</script>
