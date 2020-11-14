<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
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
      <template v-if="attachments_before" v-slot:attachments_before="$attrs">
        <DruxtView
          v-for="displayId of attachments_before"
          :key="displayId"
          :display-id="displayId"
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
          v-bind="{
            type: result.type,
            uuid: result.id,
            mode,
            ...options
          }"
          :key="result.id"
        />
      </template>

      <!-- Scoped slot: Attachments after -->
      <template v-if="attachments_after" v-slot:attachments_after="$attrs">
        <DruxtView
          v-for="displayId of attachments_after"
          :key="displayId"
          :display-id="displayId"
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
          v-bind="{
            type: result.type,
            uuid: result.id,
            mode
          }"
          :key="result.id"
        />
      </template>
    </component>
  </component>
</template>

<script>
import { mapActions } from 'vuex'
import { DruxtComponentMixin } from 'druxt'

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
    this.view = await this.getResource({
      type: this.type,
      id: this.uuid,
    })

    this.results = await this.getResource({
      type: `views--${this.viewId}`,
      id: this.displayId
    })

    await DruxtComponentMixin.fetch.call(this)
  },

  /**
   * Vue.js Data object.
   *
   * Used for on-demand JSON:API resource loading.
   *
   * @property {object[]} results - The View results JSON:API resources.
   * @property {object} view - * The View JSON:API resource.
   */
  data: () => ({
    results: [],
    view: false
  }),

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
      const displays = this.view.attributes.display
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
      const displays = this.view.attributes.display
      return Object.keys(displays).filter(key => {
        return displays[key].display_plugin === 'attachment'
          && displays[key].display_options.attachment_position === 'before'
          && typeof displays[key].display_options.displays[this.displayId] !== 'undefined'
        })
    },

    /**
     * The View Display object.
     *
     * @type {object}
     */
    display() {
      if (!this.view || !this.view.attributes) return false

      if (this.display_id === 'default') return this.view.attributes.display[this.display_id]

      return {
        ...this.view.attributes.display[this.displayId],
        ...this.view.attributes.display['default']
      }
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

      return this.display.display_options.row.options.view_mode
    },
  },

  methods: {
    /**
     * Maps `druxtRouter/getEntity` Vuex action to `this.getResource`.
     */
    ...mapActions({
      getResource: 'druxtRouter/getEntity'
    })
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.viewId, vm.displayId]],

    propsData: {
      results: vm.results,
      view: vm.view
    }
  }),

  watch: {
    async uuid() {
      await this.$fetch()
    },

    async displayId() {
      await this.$fetch()
    }
  }
}
</script>
