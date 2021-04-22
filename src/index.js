import { DruxtEntityNuxtModule } from './nuxtModule'
import * as DruxtEntityComponents from './components'
import * as DruxtEntityMixins from './mixins'

/**
 * The Nuxt.js module function.
 *
 * Installs the module functionality in a Nuxt application.
 *
 * @type {Function}
 * @exports default
 * @name DruxtEntityNuxtModule
 * @see {@link ./nuxtModule|DruxtEntityNuxtModule}
 */
export default DruxtEntityNuxtModule

/**
 * Vue.js components.
 *
 * @type {object}
 * @exports DruxtEntityComponents
 * @see {@link ./components/DruxtEntity|DruxtEntity}
 * @see {@link ./components/DruxtEntityForm|DruxtEntityForm}
 * @see {@link ./components/DruxtEntityFormButtons|DruxtEntityFormButtons}
 * @see {@link ./components/DruxtField|DruxtField}
 * @see {@link ./components/DruxtRouterEntity|DruxtRouterEntity}
 */
export { DruxtEntityComponents }
export * from './components'

/**
 * Vue.js mixins.
 *
 * @type {object}
 * @exports DruxtEntityMixins
 * @see {@link ./mixins|DruxtEntityMixins}
 * @see {@link ./mixins/entity|DruxtEntityMixin}
 * @see {@link ./mixins/field|DruxtFieldMixin}
 */
export { DruxtEntityMixins }
export * from './mixins'
