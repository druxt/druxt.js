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
      <div>
        <strong>{{ options.exposed_sorts_label }}</strong>
        <ul>
          <li
            v-for="sort of sorts"
            :key="sort.id"
          >
            <nuxt-link :to="sortBy(sort)">
              {{ sort.expose.label }}
            </nuxt-link>
          </li>
        </ul>
      </div>
    </component>
  </component>
</template>

<script>
import { DruxtComponentMixin } from 'druxt'

/**
 * The `<DruxtViewsSorts />` Vue.js component.
 *
 * @example
 * <DruxtViewsSorts
 *   :options="{}"
 *   :sorts="[{}]"
 *   type="basic"
 * />
 */
export default {
  name: 'DruxtViewsSorts',

  mixins: [DruxtComponentMixin],

  /**
   * Vue.js Properties.
   *
   * @see {@link https://vuejs.org/v2/guide/components-props.html}
   */
  props: {
    /**
     * The Exposed form options.
     *
     * @type {object}
     */
    options: {
      type: Object,
      default: () => ({}),
    },

    /**
     * The Exposed Sort objects.
     *
     * @type {object[]}
     */
    sorts: {
      type: Array,
      default: () => ([]),
    },

    /**
     * The Exposed form type.
     *
     * @type {string}
     */
    type: {
      type: String,
      default: 'basic',
    },

    /**
     * The DruxtViewSorts model value.
     *
     * @type {string}
     */
    value: {
      type: String,
      default: undefined,
    },
  },

  data() {
    return {
      model: this.value
    }
  },

  watch: {
    model() {
      this.$emit('input', this.model)
    }
  },

  methods: {
    sortBy(sort) {
      return { query: { ...this.$route.query, ...{ sort: sort.id } } }
    },
  },

  druxt: ({ vm }) => ({
    componentOptions: [[vm.type], ['default']],

    propsData: {
      options: vm.options,
      sorts: vm.sorts,
      type: vm.type,
    }
  })
}
</script>
