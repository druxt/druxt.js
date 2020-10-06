<template>
  <div>
    <component :is="wrapper.component" v-bind="wrapper.propsData">
      {{ $attrs.text }}
    </component>
  </div>
</template>

<script>
import { DruxtWrapperMixin } from 'druxt'

export default {
  mixins: [DruxtWrapperMixin],

  druxt: ({ vm }) => ({
    componentOptions: [['wrapper']],
  }),
}
</script>
