<script>
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'

/**
 * Used by the DruxtView component to render individual Druxt Wrapper themeable
 * filter components.
 */
export default {
  name: 'DruxtViewsFilter',

  extends: DruxtModule,

  /** */
  props: {
    /**
     * The Exposed Filter objects.
     *
     * @type {object}
     */
    filter: {
      type: Object,
      required: true,
    },
  },

  /** DruxtModule settings */
  druxt: {
    /**
     * Provides the available component naming options for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {ComponentOptions}
     */
    componentOptions: ({ filter }) => ([
      [filter.id],
      [filter.plugin_id, filter.id],
      ['default']
    ]),

    /**
     * Provides propsData for the DruxtWrapper.
     *
     * @param {object} context - The module component ViewModel.
     * @returns {PropsData}
     */
    propsData: ({ filter, model }) => ({ filter, value: model })
  },
}

/**
 * Provides the available component naming options for the Druxt Wrapper.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtViewsFilter[FilterId]',
 *   'DruxtViewsFilter[PluginId][FilterId]',
 *   'DruxtViewsFilter[Default]'
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtViewsFilterTaxonomyIndexTidTypeTargetId',
 *   'DruxtViewsFilterTypeTargetId',
 *   'DruxtViewsFilterTaxonomyIndexTid',
 *   'DruxtViewsFilterDefault',
 * ]
 */

/**
 * Provides propsData for the DruxtWrapper.
 *
 * @typedef {object} PropsData
 * @param {object} filter - The Exposed Filter objects.
 * @param {*} value - The DruxtViewFilter model value.
 *
 * @example @lang js
 * {
 *   filter: {
 *     admin_label: '',
 *     error_message: true,
 *     expose: {},
 *     exposed: true,
 *     field: 'type_target_id',
 *     ...
 *   },
 *   value: undefined,
 * }
 */
</script>
