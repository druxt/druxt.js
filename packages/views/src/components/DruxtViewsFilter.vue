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
    propsData: ({ filter, model }) => ({ filter, value: model }),

    /**
     * Druxt development template tool configuration.
     */
    template: {
      debug: "{ filter, model }",
      mixins: {
        'DruxtViewsFilterMixin': 'druxt-views'
      }
    }
  },
}

/**
 * Provides the available component naming options for the Druxt Wrapper.
 *
 * @typedef {array[]} ComponentOptions
 *
 * @example @lang js
 * [
 *   'DruxtViewsFilter[FilterId][Langcode]',
 *   'DruxtViewsFilter[FilterId]',
 *   'DruxtViewsFilter[PluginId][FilterId][Langcode]',
 *   'DruxtViewsFilter[PluginId][FilterId]',
 *   'DruxtViewsFilter[PluginId][Langcode]',
 *   'DruxtViewsFilter[PluginId]',
 *   'DruxtViewsFilter[Default][Langcode]'
 *   'DruxtViewsFilter[Default]'
 * ]
 *
 * @example @lang js
 * [
 *   'DruxtViewsFilterTaxonomyIndexTidTypeTargetIdEn',
 *   'DruxtViewsFilterTaxonomyIndexTidTypeTargetId',
 *   'DruxtViewsFilterTypeTargetIdEn',
 *   'DruxtViewsFilterTypeTargetId',
 *   'DruxtViewsFilterTaxonomyIndexTidEn',
 *   'DruxtViewsFilterTaxonomyIndexTid',
 *   'DruxtViewsFilterDefaultEn',
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
