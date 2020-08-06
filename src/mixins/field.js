import { DruxtEntityContextMixin } from './context'

/**
 * Provides Vue.js properties to render Drupal Field components.
 *
 * This Mixin is intended for use by `field` type Component Suggestions for
 * targetted theming of Drupal Fields.
 *
 * @mixin
 *
 * @example @lang vue
 * <template>
 *   <component
 *     :is="wrapper.component"
 *     v-bind="wrapper.props"
 *   >
 *     <div v-for="(item, key) of items" :key="key">
 *       {{ item }}
 *     </div>
 *   </component>
 * </template>
 *
 * <script>
 * // Import mixin.
 * import { DruxtFieldMixin } from 'druxt-entity'
 *
 * export default {
 *   name: 'DruxtFieldCustom',
 *
 *   // Register mixin.
 *   mixins: [DruxtFieldMixin]
 * }
 * </script>
 *
 * @see {@link ../mixins/componentSuggestion|DruxtEntityComponentSuggestionMixin}
 * @see {@link https://vuejs.org/v2/guide/mixins.html}
 */
const DruxtFieldMixin = {
  /**
   * Vue.js mixins.
   * @see {@link context|DruxtEntityContextMixin}
   * @type {object[]}
   */
  mixins: [
    DruxtEntityContextMixin
  ],

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * Inner wrapper component and props.
     * @type {object}
     * @default { component: 'div', props: {} }
     * @todo Move inner prop to new common Wrapper mixin.
     */
    inner: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    },

    /**
     * Field items.
     * @type {array}
     */
    items: {
      type: Array,
      required: true
    },

    /**
     * Field schema object.
     * @type {object}
     */
    schema: {
      type: Object,
      required: true
    },

    /**
     * Outer wrapper component and props.
     * @type {object}
     * @default { component: 'div', props: {} }
     * @todo Move wrapper prop to new common Wrapper mixin.
     */
    wrapper: {
      type: Object,
      default: () => ({
        component: 'div',
        props: {}
      })
    }
  },
}

export { DruxtFieldMixin }
