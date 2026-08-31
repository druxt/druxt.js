<script>
import DruxtFieldEntityReferenceEntityView from './DruxtFieldEntityReferenceEntityView.vue'

/**
 * Entity Reference Revisions Entity View field.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:2.0.0.
 *   Use a field wrapper component resolved by the component suggestion system instead.
 * @see https://druxtjs.org/modules/entity/deprecations
 */
export default {
  name: 'DruxtFieldEntityReferenceRevisionsEntityView',
  extends: DruxtFieldEntityReferenceEntityView,
  mounted() {
    console.warn(`[druxt-entity] The ${this.$options._componentTag} component is deprecated. See https://entity.druxtjs.org/guide/deprecations.html`)
  },
}
</script>
