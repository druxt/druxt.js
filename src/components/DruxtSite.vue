<template>
  <component :is="wrapper.component" v-bind="wrapper.propsData">
    <Nuxt />
  </component>
</template>

<script>
import { DruxtWrapperMixin } from 'druxt'

/**
 * @example @lang vue
 * <druxt module="site" />
 */
export default {
  name: 'DruxtSite',

  mixins: [DruxtWrapperMixin],

  druxt: ({ vm }) => ({
    componentOptions: [['default']]
  })
}
</script>
