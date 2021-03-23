<script>
import { DruxtEntity } from '..'
import merge from 'deepmerge'

export default {
  name: 'DruxtEntityForm',

  extends: DruxtEntity,

  props: {
    uuid: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    entity: {},
    fields: {},
    model: {},
    schema: {},
  }),

  async fetch() {
    // Fetch Schema.
    this.schema = await this.getSchema({
      resourceType: this.type,
      mode: this.mode,
      schemaType: 'form',
    })

    // Build wrapper component object.
    const options = this.getModuleComponents()
    let component = {
      is:
        ((options.filter((o) => o.global) || [])[0] || {}).name ||
        'DruxtWrapper',
      options: options.map((o) => o.name) || [],
    }

    // Get wrapper component data to merge with module settings.
    const wrapperData = await this.getWrapperData(component.is)
    component.settings = merge(
      (this.$druxtEntity || {}).options || {},
      wrapperData.druxt || {},
      { arrayMerge: (dest, src) => src }
    )

    // Fetch Entity resource.
    if (this.uuid) {
      const query = this.getQuery(component.settings)
      this.entity = (await this.getResource({ type: this.type, id: this.uuid, query })).data
    }

    // Generate fields list.
    this.fields = this.getFields()

    // Build wrapper component propsData.
    component = { ...component, ...this.getModulePropsData(wrapperData.props) }

    // Set component data.
    this.component = component
  },

  methods: {
    /**
     * Get Entity fields per Schema.
     *
     * @return {object}
     */
    getFields() {
      const data = {
        ...((this.entity || {}).attributes || {}),
        ...((this.entity || {}).relationships || {})
      }

      const fields = {}
      for (const field of this.schema.fields) {
        fields[field.id] = {
          id: field.id,
          data: data[field.id] || {},
          schema: {
            config: this.schema.config,
            ...field,
          },
          relationship: !!((this.entity || {}).relationships || {})[field.id]
        }
      }

      return fields
    },
  },

  druxt: {
    componentOptions: ({ mode, type }) => [[type, mode], [mode]],
    propsData: ({ mode, type, uuid }) => ({ mode, type, uuid }),
  },
}
</script>
