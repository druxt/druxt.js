<template>
  <component
    :is="wrapper.component"
    v-if="!$fetchState.pending"
    v-bind="wrapper.propsData"
  >
    <component
      :is="component.is"
      v-model="model"
      v-bind="component.propsData"
    >
      <ul>
        <li v-if="resource.links.prev">
          <nuxt-link
            :to="getRoute(resource.links.prev)"
            @click.native="setPage(resource.links.prev)"
          >
            {{ options.tags.previous }}
          </nuxt-link>
        </li>
        <li v-if="resource.links.next">
          <nuxt-link
            :to="getRoute(resource.links.next)"
            @click.native="setPage(resource.links.next)"
          >
            {{ options.tags.next }}
          </nuxt-link>
        </li>
      </ul>
    </component>
  </component>
</template>

<script>
import { DruxtModule } from 'druxt'

/**
 * The `<DruxtViewsPager />` Vue.js component.
 *
 * Renders a slot themable Views pager component.
 */
export default {
  name: 'DruxtViewsPager',

  extends: DruxtModule,

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The JSON:API Views results total count.
     *
     * @type {integer}
     */
    count: {
      type: [Boolean, Number],
      default: false,
    },

    /**
     * The Pager options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The JSON:API Views results resource.
     *
     * @type {object}
     */
    resource: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Pager type.
     *
     * @type {object}
     */
    type: {
      type: String,
      default: 'none',
    },

    /**
     * The DruxtViewPager model value.
     *
     * @type {integer}
     */
    value: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      model: this.value
    }
  },

  watch: {
    model(to, from) {
      if (to !== from) {
        this.$emit('input', this.model)
      }
    }
  },

  methods: {
    getQuery(link) {
      const query = Object.fromEntries(new URLSearchParams(link.href.split('?')[1]))
      if (typeof query.page === 'string') query.page = parseInt(query.page)
      return query
    },

    getRoute(link) {
      const query = this.getQuery(link)
      return { query: { ...this.$route.query, page: query.page } }
    },

    setPage(link) {
      const query = this.getQuery(link)
      this.model = query.page
    }
  },

  druxt: {
    componentOptions: ({ type }) => ([[type], ['default']]),

    propsData: (vm) => ({
      count: parseInt(vm.count),
      options: vm.options,
      resource: vm.resource,
      type: vm.type,
    })
  }
}
</script>
