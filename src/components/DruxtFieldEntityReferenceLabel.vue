<template>
  <div v-if="loading === 0">
    <component
      :is="component"
      v-for="(entity, key) of entities"
      :key="key"
      v-bind="entity.props || false"
    >
      {{ entity.text }}
    </component>
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

import { mapActions } from 'vuex'

export default {
  name: 'DruxtFieldEntityReferenceLabel',

  mixins: [DruxtFieldMixin],

  data: () => ({
    component: 'span',
    entities: false,
    loading: false
  }),

  watch: {
    loading: function() {
      if (this.loading === 0) {
        this.$forceUpdate()
      }
    }
  },

  created() {
    this.loading = this.items.length
    for (const delta in this.items) {
      const item = this.items[delta]
      this.getEntity({ id: item.uuid, type: item.type }).then((res) => {
        if (!this.entities) this.entities = []

        this.entities[delta] = {
          props: false,
          text: res.attributes[Object.keys(res.attributes).find(e => ['name', 'title'].includes(e))]
        }

        if (this.schema.settings.display.link && res.attributes.path.alias) {
          this.component = 'nuxt-link'
          this.entities[delta].props = {
            to: res.attributes.path.alias
          }
        }

        this.loading--
      })
    }
  },

  methods: {
    ...mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}
</script>
