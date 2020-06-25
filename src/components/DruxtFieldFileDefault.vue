<template>
  <component
    :is="wrapper.component"
    v-if="entities && typeof entities[0] !== 'undefined'"
    v-bind="wrapper.props"
  >
    <!-- Label: Above -->
    <div v-if="$slots['label-above']">
      <slot #label-above />
    </div>

    <!-- Label: Inline -->
    <slot
      v-if="$slots['label-inline']"
      #label-inline
    />

    <!-- Items -->
    <nuxt-link
      v-for="entity of entities"
      :key="entity.id"
      :to="entity.attributes.uri.value.replace('public://', '/sites/default/files/')"
    >
      {{ entity.attributes.filename }}
    </nuxt-link>
  </component>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

import { mapActions } from 'vuex'

export default {
  name: 'DruxtFieldFileDefault',

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

  methods: {
    ...mapActions({
      getEntity: 'druxtRouter/getEntity'
    })
  }
}
</script>

