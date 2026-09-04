<script>
import DruxtFieldEntityReferenceEntityView from './DruxtFieldEntityReferenceEntityView.vue'

/**
 * Renders an entity reference revisions field's referenced entities as DruxtEntity components.
 * @deprecated in druxt-entity:0.16.0 and is removed from druxt-entity:1.0.0.
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
