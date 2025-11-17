<script>
import DruxtFieldEntityReferenceEntityView from './DruxtFieldEntityReferenceEntityView.vue'

/**
 * Entity Reference Revisions Entity View field.
 * @deprecated
 */
export default {
  name: 'DruxtFieldEntityReferenceRevisionsEntityView',
  extends: DruxtFieldEntityReferenceEntityView,
  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag || this.$options.name} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>
