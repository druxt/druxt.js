<template>
  <component
    :is="component.is"
    v-bind="component.propsData"
  >
    <!-- Render blocks in their own named slots. --->
    <template
      v-for="block of blocks"
      v-slot:[block.attributes.drupal_internal__id]="$attrs"
    >
      <Druxt
        :key="block.id"
        module="block"
        :props-data="{
          uuid: block.id,
          type: block.type
        }"
        v-bind="$attrs"
      />
    </template>

    <!-- Render all blocks in the default slot. -->
    <template>
      <Druxt
        v-for="block of blocks"
        :key="block.id"
        module="block"
        :props-data="{
          uuid: block.id,
          type: block.type
        }"
      />
    </template>
  </component>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { DrupalJsonApiParams } from 'drupal-jsonapi-params'

import { DruxtComponentMixin } from 'druxt'

/**
 * The `<DruxtBlockRegion />` Vue.js component.
 *
 * - Loads all JSON:API Block resources for a region/theme via the Druxt.js Router module.
 * - Uses the DruxtBlock component to render individual resources, ordered by weight.
 * - Renders the data via the DruxtComponentMixin.
 *
 * @example
 * <DruxtBlockRegion
 *   name="header"
 *   theme="umami"
 * />
 *
 * @example
 * <Druxt
 *   module="block-region"
 *   name="header"
 *   theme="umami"
 * />
 *
 * @todo {@link https://github.com/druxt/druxt-blocks/issues/25|Add documentation, tests and examples for slots.}
 */
export default {
  name: 'DruxtBlockRegion',

  /**
   * Vue.js Mixins.
   *
   * @see {@link https://druxtjs.org/api/mixins/component.html|DruxtComponentMixin}
   */
  mixins: [DruxtComponentMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * Region name.
     *
     * @type {string}
     * @default content
     */
    name: {
      type: String,
      default: 'content'
    },

    /**
     * Drupal theme.
     *
     * @type {string}
     */
    theme: {
      type: String,
      required: true
    },
  },

  /**
   * Nuxt.js fetch method.
   */
  async fetch() {
    const query = new DrupalJsonApiParams()
    query
      .addFilter('region', this.name)
      .addFilter('status', '1')
      .addFilter('theme', this.theme)
      .addGroup('visibility', 'OR')
      .addFilter('visibility.request_path', null, 'IS NULL', 'visibility')

    query.addGroup('pages', 'AND', 'visibility')
      .addFilter('visibility.request_path.pages', this.route.resolvedPath, 'CONTAINS', 'pages')
      .addFilter('visibility.request_path.negate', 0, '=', 'pages')

    query.addGroup('front', 'AND', 'visibility')
      .addFilter('visibility.request_path.pages', '<front>', 'CONTAINS', 'front')
      .addFilter('visibility.request_path.negate', this.route.isHomePath ? 0 : 1, '=', 'front')

    const options = {
      headers: { 'Druxt-Request-Path': this.$store.state.druxtRouter.route.resolvedPath }
    }

    this.blocks = await this.getResources({ resource: 'block--block', query })

    await DruxtComponentMixin.fetch.call(this)
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {objects[]} blocks - The Block JSON:API resources.
   */
  data: () => ({
    blocks: []
  }),

  druxt: ({ vm }) => ({
    componentOptions: [[vm.name, vm.theme]]
  }),

  /**
   * Vue.js Computed properties.
   *
   * @vue-computed {object} route The current Route.
   */
  computed: {
    ...mapState('druxtRouter', {
      route: state => state.route
    })
  },

  /**
   * Nuxt.js watch property.
   */
  watch: {
    /**
     * Updates blocks on Route change.
     */
    $route: function() {
      this.fetch()
    }
  },

  methods: {
    /**
     * Maps `druxtRouter/getResources` Vuex action to `this.getResources`.
     */
    ...mapActions({
      getResources: 'druxtRouter/getResources'
    })
  }
}
</script>
