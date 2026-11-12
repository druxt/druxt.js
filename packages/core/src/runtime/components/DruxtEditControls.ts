import { computed, defineComponent } from 'vue'
import { isDirty } from '@druxt/core/edit'
import { useDruxtEditStore } from '../edit-store'
import { useDruxtEditing } from '../editing'

/**
 * The DruxtEditControls component is where an editor renders its controls for an entity or a field.
 *
 * The controls are such things as an edit button, a dirty mark, and a save or discard control. DruxtEntity and
 * DruxtField render this component before their output when their `editing` prop is set. They give it the entity,
 * and the field for a field.
 *
 * Core's component renders its default slot, and nothing without one.
 *
 * An editing module renders its own controls by registering a component of this name above core's, with
 * `addComponent({ name: 'DruxtEditControls', ..., priority: 1 })`. Every entity and field on the site then shows
 * them, with no change to the site's wrappers. A wrapper places them where it wants with its `editControls` slot.
 *
 * @slot default { target, draftKey, draft, field, dirty, errors, permission } - The controls. `draft` is the entity's draft in the edit store, `field` the field's state in it when the controls are a field's, and `permission` what `useDruxtEditing()` answers.
 *
 * @example <caption>An editing module's controls</caption> @lang vue
 * <script setup lang="ts">
 * const props = defineProps({ type: String, id: String, langcode: String, field: String, delta: Number })
 * const { permission } = useDruxtEditing()
 * </script>
 *
 * <template>
 *   <button v-if="permission !== 'denied'" type="button" class="edit">Edit</button>
 * </template>
 */
export default defineComponent({
  name: 'DruxtEditControls',

  props: {
    /** The entity's JSON:API resource type. */
    type: { type: String, required: true },
    /** The entity's id. Unset for a new entity. */
    id: { type: String, default: undefined },
    /** The entity's language, as its `langcode`. */
    langcode: { type: String, default: undefined },
    /** The field's id, for a field's controls. */
    field: { type: String, default: undefined },
    /** The item's index, for one value of a field that allows several. */
    delta: { type: Number, default: undefined },
  },

  setup(props, { slots }) {
    const edits = useDruxtEditStore()
    const { permission } = useDruxtEditing()
    // The draft is found as an inline editor finds it, by the entity's anchors. So a field that knows no langcode
    // finds it too.
    const match = computed(() => edits.fromAnchor({ entity: props.id, type: props.type, langcode: props.langcode, field: props.field, delta: props.delta }))
    return () => slots.default?.({
      target: { type: props.type, id: props.id, langcode: props.langcode, field: props.field, delta: props.delta },
      draftKey: match.value?.draft.key,
      draft: match.value?.draft,
      field: match.value?.field,
      dirty: isDirty(match.value?.draft, props.field),
      errors: match.value?.field?.errors || [],
      permission: permission.value,
    }) ?? null
  },
})
