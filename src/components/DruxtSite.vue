<template>
  <component :is="wrapper.component" v-bind="wrapper.propsData">
    <Nuxt />
  </component>
</template>

<script>
// import { DruxtWrapperMixin } from 'druxt'

/**
 * @example @lang vue
 * <druxt-site :wrapper="{ component: 'MySiteWrapper' }" />
 *
 * @todo {@link https://github.com/druxt/druxt-site/issues/2|Add support for DruxtJS component theme system.}
 */
export default {
  name: 'DruxtSite',

  /**
   * @todo {@link https://github.com/druxt/druxt-site/issues/2|Remove props in favour of Mixin.}
   */
  props: {
    wrapper: {
      type: Object,
      default: () => ({
        component: undefined,
        propsData: {},
      })
    },
  },

  /**
   * @todo {@link https://github.com/druxt/druxt-site/issues/2|Uncomment the following lines.}

   */
  // mixins: [DruxtWrapperMixin],

  // druxt: ({ vm }) => ({
  //   componentOptions: [['default']]
  // })
}
</script>
