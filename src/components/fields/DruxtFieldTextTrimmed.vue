<script>
import DruxtFieldTextDefault from './DruxtFieldTextDefault.vue'

/**
 * Text Trimmed field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldTextTrimmed',

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
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
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
      return item.value.slice(0, this.trimLength)
    }
  }
}
</script>
