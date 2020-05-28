<template>
  <div v-if="entities.length === items.length">
    <component :is="component" v-for="(entity, key) of entities" :key="key" v-bind="props[key]" v-html="entity.attributes.name" />
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

import { mapActions } from 'vuex'

export default {
  name: 'DruxtFieldEntityReferenceLabel',

  mixins: [DruxtFieldMixin],

  data: () => ({
    entities: []
  }),

  created() {
    for (const delta in this.items) {
      const item = this.items[delta]
      this.getEntity({ id: item.uuid, type: item.type }).then((res) => {
        this.entities[delta] = res
        this.$forceUpdate()
      })
    }
  },

  computed: {
    component() {
      return this.schema.settings.display.link ? 'nuxt-link' : 'span'
    },

    props() {
      if (!this.schema.settings.display.link) return false

      const props = []

      for (const delta in this.entities) {
        const entity = this.entities[delta]
        props[delta] = {
          to: entity.attributes.path.alias
        }
      }

      return props
    },
  },

  methods: {
    ...mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}
</script>
