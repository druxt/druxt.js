<template>
  <component :is="component.is" v-bind="component.propsData">
    <Nuxt />
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'

/**
 * @example @lang vue
 * <DruxtSite />
 *
 * @example @lang vue
 * <Druxt module="site" />
 */
export default {
  name: 'DruxtSite',

  mixins: [DruxtComponentMixin],

  druxt: ({ vm }) => ({
    componentOptions: [['default']]
  })
}
</script>
