import { DruxtEntityNuxtModule } from './nuxtModule'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtEntityNuxtModule
 * @see {@link ./nuxtModule|DruxtEntityNuxtModule}
 * @see https://druxtjs.org/modules/entity
 *
 * @example <caption>nuxt.config.js</caption> @lang js
 * module.exports = {
 *   modules: [
 *     'druxt-entity'
 *   ],
 *   druxt: {
 *     baseUrl: 'https://api.umami.demo.druxtjs.org'
 *   }
 * }
 */
export default DruxtEntityNuxtModule

/**
 * Vue.js mixins.
 *
 * @type {object}
 * @exports DruxtEntityMixins
 * @see {@link ./mixins|DruxtEntityMixins}
 * @see {@link ./mixins/entity|DruxtEntityMixin}
 * @see {@link ./mixins/field|DruxtFieldMixin}
 */
export * from './mixins'
