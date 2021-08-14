/**
 * The Vue.js Druxt component.
 *
 * @type {object}
 * @exports Druxt
 * @name Druxt
 * @see {@link ./Druxt|API documentation}
 * @see {@link /guide/#the-druxt-component|Guide}
 *
 * @example @lang js <caption>Register globally</caption>
 * import Vue from 'vue'
 * import { Druxt } from 'druxt'
 *
 * Vue.component(Druxt)
 *
 * @example @lang vue <caption>Register locally</caption>
 * <template>
 *   <Druxt :module="module" />
 * </template>
 *
 * <script>
 * import { Druxt } from 'druxt'
 * export default {
 *   components: { Druxt }
 * }
 * </script>
 */
 export { default as Druxt } from './Druxt.vue'

 /**
 * The DruxtModule base Vue.js component.
 *
 * @type {object}
 * @exports DruxtModule
 * @name DruxtModule
 * @see {@link ./DruxtModule|API documentation}
 *
 * @example @lang vue
 * <script>
 * import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
 * export default {
 *   name: 'MyDruxtModule',
 *   extends: DruxtModule,
 *   druxt: {
 *     componentOptions: () => ([['wrapper']]),
 *     propsData: (ctx) => ({ prop: ctx.prop }),
 *   }
 * }
 * </script>
 */
export { default as DruxtModule } from './DruxtModule.vue'

/**
 * The default Druxt module wrapper Vue.js component.
 *
 * @type {object}
 * @exports DruxtWrapper
 * @name DruxtWrapper
 * @see {@link ./DruxtWrapper|API documentation}
 * @see {@link /guide/#the-druxt-component|Guide}
 * @private
 */
 export { default as DruxtWrapper } from './DruxtWrapper.vue'
