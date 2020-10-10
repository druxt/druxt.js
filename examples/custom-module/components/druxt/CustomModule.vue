<template>
  <component :is="component.is" v-bind="component.propsData">
    {{ $attrs.text }}
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'

export default {
  name: 'DruxtCustomModule',

  mixins: [DruxtComponentMixin],

  druxt: ({ vm }) => ({
    componentOptions: [['wrapper']],
  }),
}
</script>
