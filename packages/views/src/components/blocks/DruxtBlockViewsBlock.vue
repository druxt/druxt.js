<template>
  <div v-if="!$fetchState.pending">
    <DruxtView v-bind="propsData" />
  </div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { mapActions } from 'vuex'
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

/**
 * Views block.
 *
 * _This component is intended to be rendered by the `<DruxtBlock />` component._
 *
 * - Renders a Views block component.
 *
 * @example
 * <DruxtBlock
 *   uuid="43d613c6-ab66-453d-bce1-e1dfc990b4a1"
 * />
 *
 * @see {@link https://blocks.druxtjs.org/api/components/DruxtBlock.html|DruxtBlock}
 */
export default {
  name: 'DruxtBlockViewsBlock',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://blocks.druxtjs.org/api/mixins/block.html|DruxtBlocksBlockMixin}
   */
  mixins: [DruxtBlocksBlockMixin],

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {(string|boolean)} uuid - The Views JSON:API resource UUID.
   */
  data: () => ({
    uuid: false
  }),

  /**
   * Nuxt fetch method.
   */
  async fetch() {
    const results = await this.getCollection({
      type: 'view--view',
      query: new DrupalJsonApiParams()
        .addFilter('drupal_internal__id', this.viewId)
        .addFields('view--view', ['id'])
    })
    this.uuid = results.data[0].id
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The View Display ID.
     *
     * @type {string}
     */
    displayId() {
      return this.settings.id.match(/views_block:(.*?)-(.*)/)[2]
    },

    /**
     * Properties to pass through to the `<DruxtViews />` component.
     *
     * @type {object}
     *
     * @see {@link ../DruxtView|DruxtView}
     */
    propsData() {
      if (!this.uuid) return false

      return {
        displayId: this.displayId,
        uuid: this.uuid,
        viewId: this.viewId
      }
    },

    /**
     * The View ID.
     *
     * @type {string}
     */
    viewId() {
      return this.settings.id.match(/views_block:(.*?)-(.*)/)[1]
    },
  },

  methods: {
    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getCollection: 'druxt/getCollection',
    })
  }
}
</script>
