<script>
import DruxtFieldTextDefault from './DruxtFieldTextDefault.vue'

/**
 * Text Summary or Trimmed field.
 * @deprecated
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
