<template>
  <div>
    <label :for="filter.id">{{ filter.expose.label }}:</label>

    <!-- Basic string field based filter. -->
    <input
      v-if="filter.plugin_id === 'string'"
      :id="filter.id"
      v-model="model"
    />

    <!-- Select list based filter. -->
    <select v-else :id="filter.id">
      <option v-for="option of options" :key="option">{{ option }}</option>
    </select>
  </div>
</template>

<script>
import { DruxtViewsFilterMixin } from 'druxt-views'

export default {
  mixins: [DruxtViewsFilterMixin],

  computed: {
    // @TODO - build available filter options based on configuration.
    options: () => {
      return []
    }
  }
}
</script>
