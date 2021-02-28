<script>
import DruxtFieldTextDefault from './DruxtFieldTextDefault.vue'

/**
 * Text Trimmed field.
 *
 * _This component is intended to be rendered by the `<druxt-field />` component._
 *
 * @see {@link DruxtField}
 *
 * @example
 * <druxt-field
 *   :data="{
 *     format: 'basic_html',
 *     processed: '<p><strong>Umami Magazine &amp; Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.</p>',
 *     value: '<strong>Umami Magazine & Umami Publications</strong> is a fictional magazine and publisher for illustrative purposes only.'
 *   }"
 *   :schema="{
 *     id: 'body',
 *     type: 'text_trimmed',
 *     settings: {
 *       display: {
 *         trim_length: 600,
 *       },
 *     },
 *   }"
 * />
 */
export default {
  name: 'DruxtFieldTextTrimmed',

  extends: DruxtFieldTextDefault,

  /**
   * Vue.js Computed properties.
   */
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
      return item.value.slice(0, this.trimLength)
    }
  }
}
</script>
