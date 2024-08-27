/**
 * Vuex store module.
 *
 * @type {object}
 * @exports DruxtViewsStore
 * @name DruxtViewsStore
 * @see {@link ./stores/views|DruxtViewsStore}
 */
export { DruxtViewsStore } from './stores/views'

/**
 * Vue.js mixins.
 *
 * @type {object}
 * @exports DruxtViewsMixins
 * @see {@link ./mixins|DruxtViewsMixins}
 * @see {@link ./mixins/filter|DruxtViewsFilterMixin}
 * @see {@link ./mixins/filters|DruxtViewsFiltersMixin}
 * @see {@link ./mixins/pager|DruxtViewsPagerMixin}
 * @see {@link ./mixins/sorts|DruxtViewsSortsMixin}
 * @see {@link ./mixins/view|DruxtViewsViewMixin}
 */
export * from './mixins'

/**
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("DruxtViews Nuxt module must be installed as 'druxt-views/nuxt'")
}
