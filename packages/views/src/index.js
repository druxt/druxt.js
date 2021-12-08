import { DruxtViewsNuxtModule } from './nuxt'
DruxtViewsNuxtModule.meta = require('../package.json')

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtViewsNuxtModule
 * @see {@link ./nuxt|DruxtViewsNuxtModule}
 */
export default DruxtViewsNuxtModule

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
