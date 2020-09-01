<template>
  <div>
    <druxt-view v-if="props" v-bind="props" />
  </div>
</template>

<script>
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'
import { mapActions } from 'vuex'
import { DruxtBlocksBlockMixin } from 'druxt-blocks'

/**
 * Views block.
 *
 * _This component is intended to be rendered by the `<druxt-block />` component._
 *
 * - Renders a Views block component.
 *
 * @todo Add example.
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
   * Nuxt.js fetch method.
   */
  async fetch() {
    await this.fetch()
  },

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
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * The View Display ID.
     *
     * @type {string}
     */
    displayId() {
      return this.settings.id.match(/views_block\:(.*?)-(.*)/)[2]
    },

    /**
     * Properties to pass through to the `<druxt-views />` component.
     *
     * @type {object}
     *
     * @see {@link ../DruxtView|DruxtView}
     */
    props() {
      if (!this.uuid) return false

      const parts = this.settings.id.match(/views_block\:(.*?)-(.*)/)

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
      return this.settings.id.match(/views_block\:(.*?)-(.*)/)[1]
    },
  },

  created() {
    // Workaround for Vuepress docs.
    if (!this.$fetch) {
      this.fetch()
    }
  },

  methods: {
    /**
     * Fetch requested View from Druxt.js Router.
     */
    async fetch() {
      const query = new DrupalJsonApiParams()
      query
        .addFilter('drupal_internal__id', this.viewId)
        .addFields('view--view', ['id'])

      const results = await this.getResources({ resource: 'view--view', query })
      this.uuid = results[0].id
    },

    /**
     * Maps `druxtRouter/getResources` Vuex action to `this.getResources`.
     */
    ...mapActions({
      getResources: 'druxtRouter/getResources'
    })
  }
}
</script>
