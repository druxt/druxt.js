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

/**
 * Default function to alert user to incorrectly installed module.
 *
 * This was added as part of the @nuxt/kit update due to breaking changes.
 */
export default () => {
  throw new Error("DruxtEntity Nuxt module must be installed as 'druxt-entity/nuxt'")
}
