<template>
  <div v-if="entities && typeof entities[0] !== 'undefined'">
    <img
      v-for="entity of entities"
      :key="entity.id"
      :src="entity.attributes.uri.value.replace('public://', '/sites/default/files/')"
    />
  </div>
</template>

<script>
import { DruxtFieldMixin } from '../mixins/field'

import { mapActions } from 'vuex'

export default {
  name: 'DruxtFieldResponsiveImage',

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

<style scoped>
img {
  width: 100%;
}
</style>
