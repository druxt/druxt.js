<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending && this.view"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      v-model="model"
      v-bind="component.propsData"
    >
      <!-- Scoped slot: Header -->
      <template v-slot:header>
        <span
          v-for="header of headers"
          :key="header.id"
          v-html="header.content.value"
        />
      </template>

      <!-- Scoped slot: Attachments before -->
      <template
        v-if="attachments_before"
        v-slot:attachments_before="$attrs"
      >
        <DruxtView
          v-for="attachmentDisplayId of attachments_before"
          :key="attachmentDisplayId"
          :display-id="attachmentDisplayId"
          :type="type"
          :uuid="uuid"
          :view-id="viewId"
          v-bind="$attrs"
        />
      </template>

      <!-- Scoped slot: Results -->
      <template v-slot:results="options">
        <DruxtEntity
          v-for="result of results"
          :key="result.id"
          v-bind="{
            type: result.type,
            uuid: result.id,
            mode,
            ...options
          }"
        />
      </template>

      <!-- Scoped slot: Pager -->
      <template
        v-if="showPager"
        #pager="$attrs"
      >
        <DruxtViewsPager
          v-model="model.page"
          v-bind="{ count, ...pager, resource, ...$attrs }"
        />
      </template>

      <!-- Scoped slot: Attachments after -->
      <template
        v-if="attachments_after"
        v-slot:attachments_after="$attrs"
      >
        <DruxtView
          v-for="attachmentDisplayId of attachments_after"
          :key="attachmentDisplayId"
          :display-id="attachmentDisplayId"
          :type="type"
          :uuid="uuid"
          :view-id="viewId"
          v-bind="$attrs"
        />
      </template>

      <template>
        <!-- Header -->
        <span
          v-for="header of headers"
          :key="header.id"
          v-html="header.content.value"
        />

        <!-- Results -->
        <DruxtEntity
          v-for="result of results"
          :key="result.id"
          v-bind="{
            type: result.type,
            uuid: result.id,
            mode
          }"
        />

        <!-- Pager -->
        <DruxtViewsPager
          v-if="showPager"
          v-model="model.page"
          v-bind="{ count, ...pager, resource }"
        />
      </template>
    </component>
  </component>
</template>

<script>
import merge from 'deepmerge'
import { DruxtComponentMixin } from 'druxt'
import { parse, stringify } from 'qs'
import { mapActions } from 'vuex'

/**
 * The `<DruxtView />` Vue.js component.
 *
 * @example
 * <DruxtView
 *   displayId="block_1"
 *   uuid="6ee5e720-bbbf-4d79-b600-21ebc0d954c5"
 *   viewId="promoted_items"
 * />
 */
export default {
  name: 'DruxtView',

  mixins: [DruxtComponentMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The View Display ID.
     *
     * @type {string}
     * @default default
     */
    displayId: {
      type: String,
      default: 'default',
    },

    /**
     * JSON:API Resource type.
     *
     * @type {string}
     * @default view--view
     */
    type: {
      type: String,
      default: 'view--view'
    },

    /**
     * The View UUID.
     *
     * @type {string}
     */
    uuid: {
      type: String,
      required: true
    },

    /**
     * The View ID.
     *
     * @type {string}
     */
    viewId: {
      type: String,
      required: true
    }
  },

  /**
   * Nuxt fetch method.
   */
  async fetch() {
    if (!this.view) {
      this.view = await this.getResource({
        type: this.type,
        id: this.uuid,
      })
    }

    this.resource = await this.getResults({
      viewId: this.viewId,
      displayId: this.displayId,
      query: stringify(this.query)
    })

    await DruxtComponentMixin.fetch.call(this)
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {object} view - The View JSON:API resource.
   */
  data() {
    // Stringify and parse the query object to fix nested objects.
    const model = parse(stringify(this.$route.query))

    return {
      model: {
        page: parseInt(model.page) || null,
      },
      resource: null,
      view: false
    }
  },

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * IDs of displays to be attached after the view.
     *
     * @type {string[]}
     */
    attachments_after() {
      if (!((((this.view || {}).data || {}).attributes || {}).display)) return false

      const displays = this.view.data.attributes.display
      return Object.keys(displays).filter(key => {
        return displays[key].display_plugin === 'attachment'
          && displays[key].display_options.attachment_position === 'after'
          && typeof displays[key].display_options.displays[this.displayId] !== 'undefined'
        })
    },

    /**
     * IDs of displays to be attached before the view.
     *
     * @type {string[]}
     */
    attachments_before() {
      if (!((((this.view || {}).data || {}).attributes || {}).display)) return false

      const displays = this.view.data.attributes.display
      return Object.keys(displays).filter(key => {
        return displays[key].display_plugin === 'attachment'
          && displays[key].display_options.attachment_position === 'before'
          && typeof displays[key].display_options.displays[this.displayId] !== 'undefined'
        })
    },

    /**
     * The total item count.
     *
     * @type {integer}
     */
    count() {
      return parseInt(((this.resource || {}).meta || {}).count) || 0
    },

    /**
     * The View Display object.
     *
     * @type {object}
     */
    display() {
      if (!(((this.view || {}).data || {}).attributes || {}).display) return false

      if (this.display_id === 'default') return this.view.data.attributes.display[this.display_id]

      return merge(
        this.view.data.attributes.display['default'],
        this.view.data.attributes.display[this.displayId]
      )
    },

    /**
     * The View Headers data.
     *
     * @type {@object}
     */
    headers() {
      if (!this.display) return []

      return this.display.display_options.header
    },

    /**
     * The View mode for the results entities.
     *
     * @type {string}
     */
    mode() {
      if (!this.display) return false

      if (!this.display.display_options.row.type.includes('entity:')) return false

      return (this.display.display_options.row.options || {}).view_mode || 'default'
    },

    /**
     * The displays pager settings.
     *
     * @type {object}
     */
    pager() {
      return ((this.display || {}).display_options || {}).pager || false
    },

    query() {
      const query = {}

      // Pagination.
      if (this.model.page) {
        query.page = this.model.page
      }

      return query
    },

    /**
     * The JSON:API Views results.
     *
     * @type {object}
     */
    results() {
      return (this.resource || {}).data || []
    },

    /**
     * Whether a pager should be shown.
     *
     * @type {boolean}
     */
    showPager() {
      return this.pager.type && this.pager.type !== 'none'
    },
  },

  watch: {
    async '$route.query'(to, from) {
      if (!Object.entries(to).length) {
        this.model = {
          page: null,
        }
        await this.$fetch
      }
    },

    async displayId() {
      await this.$fetch()
    },

    async query(to, from) {
      await this.$fetch()
    },

    async uuid() {
      await this.$fetch()
    },
  },

  methods: {
    /**
     * Maps Vuex action to methods.
     */
    ...mapActions({
      getResource: 'druxt/getResource',
      getResults: 'druxt/views/getResults'
    })
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.viewId, vm.displayId]],

    propsData: {
      count: vm.count,
      display: vm.display,
      mode: vm.mode,
      pager: vm.pager,
      results: vm.results,
      view: vm.view
    }
  })
}
</script>
