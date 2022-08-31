<template>
  <div>
    <slot name="filters" />
    <div class="items">
      <DruxtEntity
        v-for="result of results"
        :key="result.id"
        :uuid="result.id"
        :type="result.type"
        mode="card"
      >
        <template #default="{ entity }">
          <AppCard :title="entity.attributes.title" @click.native="setEntity(entity)" />
        </template>
      </DruxtEntity>
    </div>
  </div>
</template>

<script>
import { DruxtViewsViewMixin } from 'druxt-views'
import { mapMutations } from 'vuex'

export default {
  mixins: [DruxtViewsViewMixin],

  methods: {
    ...mapMutations(['setEntity']),
  }
}
</script>

<style scoped>
.items {
  display: grid;
  grid-template-columns: auto auto auto;
  column-gap: 4rem;
}
</style>
