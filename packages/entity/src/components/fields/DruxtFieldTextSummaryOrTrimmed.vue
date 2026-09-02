<script>
import DruxtFieldTextDefault from './DruxtFieldTextDefault.vue'

/**
 * Text Summary or Trimmed field.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:2.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
 */
export default {
  name: 'DruxtFieldTextSummaryOrTrimmed',

  extends: DruxtFieldTextDefault,

  /** */
  computed: {
    /**
     * Trim length.
     *
     * @type {integer}
     *
     * @default 600
     */
    trimLength() {
      return (((this.schema || {}).settings || {}).display || {}).trim_length || 600
    },
  },

  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://druxtjs.org/modules/entity/deprecations`)
  },

  methods: {
    /**
     * Formats the item output.
     *
     * @param {object} item - The field item.
     *
     * @return {string}
     */
    format(item) {
      return item.summary
        ? item.summary
        : item.value.slice(0, this.trimLength)
    }
  }
}
</script>
