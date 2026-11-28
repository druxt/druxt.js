<script>
import { default as DruxtEntity } from './DruxtEntity.vue'

/**
 * Saved resource data with the edits made to the model since it was sent, so
 * an edit made while a save runs stays.
 *
 * @param {object} saved - The resource data Drupal returned.
 * @param {object} sent - The model as it was sent.
 * @param {object} model - The model now.
 * @return {object} A copy of the saved data, with the fields edited since the save started taken from the model.
 */
const withLaterEdits = (saved, sent, model) => {
  const data = JSON.parse(JSON.stringify(saved))
  for (const part of ['attributes', 'relationships']) {
    // A field emptied since, which the field input handler removes.
    for (const key of Object.keys(sent[part] || {})) {
      if (!(key in (model[part] || {})) && data[part]) delete data[part][key]
    }
    for (const [key, value] of Object.entries(model[part] || {})) {
      if (JSON.stringify(value) === JSON.stringify((sent[part] || {})[key])) continue
      data[part] = { ...(data[part] || {}), [key]: JSON.parse(JSON.stringify(value)) }
    }
  }
  return data
}

/**
 * The DruxtEntityForm component renders a Drupal Content Entity edit form by
 * JSON:API resource type, UUID, view mode and schema type.
 *
 * Fields are rendered as DruxtField components, based on the Drupal display
 * mode configuration.
 *
 * @example @lang vue
 * <DruxtEntityForm
 *   :type="resourceType"
 *   :uuid="uuid"
 *   :mode="displayMode"
 *   v-on:error="onError()"
 *   v-on:reset="onReset()"
 *   v-on:submit="onSubmit()"
 * />
 *
 * @example <caption>DruxtEntityForm Wrapper component boilerplate</caption> @lang vue
 * <template>
 *   <DruxtDebug :json="entity" />
 * </template>
 *
 * <script>
 * import { DruxtEntityMixin } from 'druxt-entity'
 * export default {
 *   mixins: [DruxtEntityMixin]
 * }
 *
 * @example <caption>DruxtEntityForm default slot (template injection)</caption> @lang vue
 * <DruxtEntityForm type="">
 *   <template #default="{ entity }">
 *     <!-- Do whatever you want here -->
 *     <DruxtDebug :json="entity" />
 *   </template>
 * </DruxtEntity>
 *
 * @extends DruxtEntity
 * @see {@link ./DruxtEntity|DruxtEntity}
 * @see https://druxtjs.org/modules/entity
 */
export default {
  name: 'DruxtEntityForm',

  /**
   * @see {@link ./DruxtEntity|DruxtEntity}
   */
  extends: DruxtEntity,

  /**
   * Vue.js Properties.
   */
  props: {
    /**
     * Drupal display schema type, 'view' or 'form'.
     *
     * @type {('view'|'form')}
     * @default form
     */
    schemaType: {
      type: String,
      default: 'form',
    },
  },

  /**
   * Vue.js Data object.
   *
   * @property {object} response - The form submission response data.
   * @property {boolean} submitting - Whether the form is currently being submitted.
   */
  data: () => ({
    response: undefined,
    submitting: false,
  }),

  /**
   * Vue.js Computed properties.
   */
  computed: {
    /**
     * An array of errors if present in the form submission response data.
     *
     * @param {object} vm - The component ViewModel.
     * @param {object} vm.response - The form submission response data.
     * @return {object[]} The JSON:API errors from the form submission response, or `undefined`.
     */
    errors: ({ response }) => (response || {}).errors,
  },

  methods: {
    /**
     * Reset event handler:
     * - Sets `model` back to the stored entity, or to the copy last taken of it when the store holds none.
     * - Unsets `response` data.
     * - Emits `reset`.
     *
     * @return {(boolean|undefined)} `false` while the next language or another entity loads, as there is nothing of it to reset to.
     */
    onReset() {
      // Until this language loads, the entity falls back to the previous
      // language's model, and resetting to it would label it this language.
      if (this._druxtLoaded && this._druxtModelLang !== this.lang) return false
      if (this.storedEntity) {
        this.setModelFromStore(this.entity)
      } else if (this.uuid) {
        // Nothing stored, as while the entity loads again after a flush: go
        // back to the copy the edits are compared with, when it is this
        // entity's. The previous entity's copy is still here while another
        // entity loads.
        const copy = typeof this._druxtPristine === 'string' ? JSON.parse(this._druxtPristine) : {}
        if (copy.id !== this.uuid) return false
        this.setModelFromStore({ ...copy, included: (this.model || {}).included })
      }
      this.response = undefined
      this.$emit('reset')
    },

    /**
     * Submit event handler:
     * - Sends data to backend via POST or PATCH.
     * - Catches errors.
     * - Emits `submit` or `error` event.
     *
     * @return {Promise<(boolean|undefined)>} `false` when nothing is sent, which is while a save runs and while the next language loads.
     */
    async onSubmit() {
      if (this.submitting) return false
      // After a language change, the model is the previous language's until
      // this language loads, and saving it would write it to this one.
      if (this._druxtLoaded && this._druxtModelLang !== this.lang) return false
      this.submitting = true

      let method = 'createResource'
      if (this.model.id) {
        method = 'updateResource'
      }

      // The language the form showed when it was submitted, which may change
      // while the request runs.
      const lang = this.lang
      // The model as sent, to tell the edits made while the request runs.
      const sent = JSON.parse(JSON.stringify(this.model))
      // For a language change during the save, which puts those edits away.
      this._druxtSaving = { id: sent.id, lang, sent: this.pristineOf(sent) }

      try {
        // The request goes to the form's language, where its answer is stored.
        // It takes the copy, as the client builds the request after a wait
        // and the model can change meanwhile.
        this.response = await this.$druxt[method](JSON.parse(JSON.stringify(sent)), lang)
        const resource = this.response.data.data
        // Store Drupal's answer, so every component showing the entity shows
        // what was saved, and no request from before the save replaces it.
        this.$store.dispatch('druxt/storeResource', { resource: { ...this.response.data }, prefix: lang })
        const stored = (((this.$store.state.druxt.resources[resource.type] || {})[resource.id] || {})[lang] || {}).data
        const saved = stored || resource
        if ((this.model || {}).id !== sent.id) {
          // The form shows another entity now. The answer is in the store,
          // and this model isn't the one that was saved.
        } else if (this.lang === lang) {
          // Take the answer as the model, with any edit made since the save
          // started. A model still in another language, after a language
          // change and back, doesn't hold edits to this one. A new entity's
          // form has no marker until its first save, and its model is in the
          // form's language.
          const model = this.model
          const inLang = !this._druxtLoaded || this._druxtModelLang === lang
          // The edits made since are in the model, or, after a change to
          // another language and back before this one loaded again, in what
          // was put away for it. Either way nothing is left put away.
          const drafts = this._druxtDrafts || {}
          const later = inLang ? model : (drafts[lang] || {}).model
          delete drafts[lang]
          this.setModelFromStore({ ...saved, included: model.included })
          if (later && this.pristineOf(later) !== this.pristineOf(sent)) {
            this.model = { ...withLaterEdits(saved, sent, later), included: later.included }
          }
        } else if ((this._druxtDrafts || {})[lang]) {
          // The form shows another language now. The saved language shows
          // what was saved when it comes back, with any edit made since the
          // save started.
          const draft = this._druxtDrafts[lang]
          if (this.pristineOf(draft.model) === this.pristineOf(sent)) {
            delete this._druxtDrafts[lang]
          } else {
            this._druxtDrafts[lang] = {
              model: { ...withLaterEdits(saved, sent, draft.model), included: draft.model.included },
              pristine: this.pristineOf(saved),
            }
          }
        } else if (this._druxtLoaded && this._druxtModelLang === lang && this._druxtPristineLang === lang) {
          // Another language is chosen and hasn't started loading, as while
          // a fetch runs out its delay, so the form still holds the saved
          // language's model. What was saved is the copy its edits are
          // compared with from here, or the language change would put the
          // saved model away as unsaved.
          const model = this.model
          const edited = this.pristineOf(model) !== this.pristineOf(sent)
          this.setPristine(saved, lang)
          this.model = { ...(edited ? withLaterEdits(saved, sent, model) : JSON.parse(JSON.stringify(saved))), included: model.included }
        }
        this.$emit('submit', resource)
      } catch (err) {
        // Network-level failures reject without a response object.
        this.response = (err.response || {}).data
        this.$emit('error', this.response)
      }

      this._druxtSaving = undefined
      this.submitting = false
    },
  },

  druxt: {
    ...DruxtEntity.druxt,

    /**
     * Adds a `buttons` slot to the DruxtEntity scope slots.
     *
     * @param {Function} h - The Vue createElement function.
     * @return {object} The DruxtEntity scoped slots, with an added `buttons` slot and a default slot that appends the form buttons after the fields.
     */
    slots(h) {
      // Use DruxtEntity to build the Field based slots.
      const scopedSlots = DruxtEntity.druxt.slots.call(this, h)

      scopedSlots.buttons = (attrs) => h(
        'DruxtEntityFormButtons',
        {
          attrs,
          on: {
            reset: this.onReset,
            submit: this.onSubmit,
          },
          props: {
            schema: this.schema || {},
          },
          ref: 'buttons',
        },
      )

      // Build default slot.
      scopedSlots.default = (attrs) => [
        ...Object.entries(this.fields).map(([id]) => scopedSlots[id](attrs)),
        scopedSlots.buttons(attrs)
      ]

      return scopedSlots
    },
  },
}
</script>
