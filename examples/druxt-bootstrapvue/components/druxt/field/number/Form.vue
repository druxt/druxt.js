<template>
  <label :class="schema.id">
    <strong>{{ $parent.label.text }}:</strong>
    <br />
    <div>
      <input v-model.number="model" type="number" />
    </div>
  </label>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'

// DruxtField's isText check only matches schema.type 'number_integer' -
// Drupal's plain number field widget reports 'number', so
// field_preparation_time/field_cooking_time/field_number_of_servings all
// fell through to a free-text textarea instead of a number input.
//
// schema.id is set as a class so the modal's CSS can pair
// field_preparation_time/field_cooking_time into one row (see
// pages/index.vue) without touching this component's own markup.
export default {
  mixins: [DruxtFieldMixin],
}
</script>
