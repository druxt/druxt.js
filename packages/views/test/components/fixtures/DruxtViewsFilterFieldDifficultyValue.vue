<template>
  <label>
    {{ filter.expose.label }}
    <select data-test="difficulty" :value="value || ''" @change="$emit('input', $event.target.value || undefined)">
      <option value="">- Any -</option>
      <option value="easy">Easy</option>
      <option value="medium">Medium</option>
      <option value="hard">Hard</option>
    </select>
  </label>
</template>

<script>
import { DruxtViewsFilterMixin } from '../../../src/mixins/filter'

// A site's own wrapper for the Difficulty filter, as a select.
export default {
  name: 'DruxtViewsFilterFieldDifficultyValue',

  mixins: [DruxtViewsFilterMixin],
}
</script>
